<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\UserResource;
use App\Http\Traits\ApiResponse;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    use ApiResponse;

    /**
     * Display a paginated listing of users for admin management.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with('employer');

        // Role filter: 'employee' (Job Seekers), 'employer', 'admin'
        if ($request->filled('role')) {
            $query->where('role', $request->string('role')->value());
        }

        // Status filter: 'active', 'suspended'
        if ($request->filled('status')) {
            $status = $request->string('status')->value();
            if ($status === 'suspended') {
                $query->where('is_suspended', true);
            } elseif ($status === 'active') {
                $query->where('is_suspended', false);
            }
        }

        // Search filter: name, email, username, or employer company_name
        if ($request->filled('search')) {
            $search = $request->string('search')->value();
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhereHas('employer', function ($empQ) use ($search): void {
                        $empQ->where('company_name', 'like', "%{$search}%");
                    });
            });
        }

        $users = $query->latest()->paginate($request->integer('per_page', 15));

        return $this->success(
            UserResource::collection($users)->response()->getData(true),
            'Users retrieved successfully'
        );
    }

    /**
     * Toggle the suspension status of a user.
     */
    public function toggleSuspend(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return $this->error('You cannot suspend your own account', 422);
        }

        $user->is_suspended = ! $user->is_suspended;
        $user->save();

        if ($user->is_suspended) {
            // Revoke active tokens when user is suspended
            $user->tokens()->delete();
        }

        $message = $user->is_suspended
            ? 'User account has been suspended successfully'
            : 'User account has been reactivated successfully';

        return $this->success(
            new UserResource($user->load('employer')),
            $message
        );
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return $this->error('You cannot delete your own account', 422);
        }

        $user->delete();

        return $this->success(null, 'User account deleted successfully');
    }
}
