<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Employer\StoreEmployerRequest;
use App\Http\Requests\V1\Employer\UpdateEmployerRequest;
use App\Http\Traits\ApiResponse;
use App\Models\Employer;
use App\Services\AdminNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EmployerController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $employers = Employer::with('user')->paginate(15);

        return $this->success($employers, 'Employers retrieved successfully');
    }

    public function myProfile(Request $request): JsonResponse
    {
        $employer = $request->user()->employer;

        if (! $employer) {
            return $this->error('Employer profile not found', 404);
        }

        return $this->success($employer->load('user'), 'Employer profile retrieved successfully');
    }

    public function updateMyProfile(UpdateEmployerRequest $request): JsonResponse
    {
        $employer = $request->user()->employer;

        $data = $request->validated();

        if ($request->hasFile('logo')) {
            if ($employer && $employer->logo && Storage::disk('public')->exists($employer->logo)) {
                Storage::disk('public')->delete($employer->logo);
            }
            $data['logo'] = $request->file('logo')->store('logos', 'public');
        }

        if (! $employer) {
            $employer = Employer::create([
                ...$data,
                'user_id' => $request->user()->id,
            ]);

            app(AdminNotificationService::class)->notifyEmployerPendingApproval($employer);

            return $this->created($employer, 'Employer profile created successfully');
        }

        $employer->update($data);

        return $this->success($employer, 'Employer profile updated successfully');
    }

    public function pending(): JsonResponse
    {
        if (! auth()->user()->hasRole(UserRole::ADMIN)) {
            return $this->forbidden('Only admins can view pending employers');
        }

        $employers = Employer::with('user')
            ->where('approval_status', 'pending')
            ->paginate(15);

        return $this->success($employers, 'Pending employers retrieved successfully');
    }

    public function store(StoreEmployerRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('logos', 'public');
        }

        $employer = Employer::create([
            ...$data,
            'user_id' => $request->user()->id,
        ]);

        app(AdminNotificationService::class)->notifyEmployerPendingApproval($employer);

        return $this->created($employer, 'Employer profile created successfully');
    }

    public function show(Employer $employer): JsonResponse
    {
        return $this->success($employer->load('user'), 'Employer retrieved successfully');
    }

    public function update(UpdateEmployerRequest $request, Employer $employer): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('logo')) {
            if ($employer->logo && Storage::disk('public')->exists($employer->logo)) {
                Storage::disk('public')->delete($employer->logo);
            }
            $data['logo'] = $request->file('logo')->store('logos', 'public');
        }

        $employer->update($data);

        return $this->success($employer, 'Employer profile updated successfully');
    }

    public function updateApprovalStatus(Request $request, Employer $employer): JsonResponse
    {
        if (! auth()->user()->hasRole(UserRole::ADMIN)) {
            return $this->forbidden('Only admins can update employer approval status');
        }

        $request->validate([
            'approval_status' => 'required|in:approved,rejected',
        ]);

        $employer->update(['approval_status' => $request->approval_status]);

        return $this->success($employer, 'Employer approval status updated successfully');
    }

    public function destroy(Employer $employer): JsonResponse
    {
        if ($employer->logo && Storage::disk('public')->exists($employer->logo)) {
            Storage::disk('public')->delete($employer->logo);
        }

        $employer->delete();

        return $this->deleted('Employer profile deleted successfully');
    }
}
