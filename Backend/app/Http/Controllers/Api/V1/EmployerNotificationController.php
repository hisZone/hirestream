<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\NotificationResource;
use App\Http\Traits\ApiResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployerNotificationController extends Controller
{
    use ApiResponse;

    /**
     * Display a paginated listing of notifications for the authenticated employer.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = $request->boolean('unread')
            ? $user->unreadNotifications()
            : $user->notifications();

        $notifications = $query->paginate($request->integer('per_page', 15));

        return $this->success(
            NotificationResource::collection($notifications)->response()->getData(true),
            'Notifications retrieved successfully'
        );
    }

    /**
     * Stream real-time notifications to the employer via Server-Sent Events (SSE).
     */
    public function stream(Request $request): StreamedResponse
    {
        $user = $request->user();

        return response()->stream(function () use ($user): void {
            while (ob_get_level() > 0) {
                ob_end_flush();
            }

            $connectionStartTime = now()->subSeconds(5);
            $seenIds = [];
            $startTime = time();
            $maxExecutionTime = app()->runningUnitTests() ? 1 : 25;

            // Initial connected handshake
            echo "event: connected\ndata: {}\n\n";
            flush();

            while (time() - $startTime < $maxExecutionTime) {
                if (connection_aborted()) {
                    break;
                }

                $newNotifications = $user->unreadNotifications()
                    ->whereNotIn('id', $seenIds)
                    ->where('created_at', '>=', $connectionStartTime)
                    ->orderBy('created_at', 'asc')
                    ->get();

                if ($newNotifications->isNotEmpty()) {
                    $unreadCount = $user->unreadNotifications()->count();
                    foreach ($newNotifications as $notification) {
                        $seenIds[] = $notification->id;
                        $payloadData = (new NotificationResource($notification))->resolve();
                        $payloadData['unread_count'] = $unreadCount;
                        $payload = json_encode($payloadData);
                        echo "event: notification\ndata: {$payload}\n\n";
                    }
                    flush();
                } else {
                    echo ": ping\n\n";
                    flush();
                }

                if (app()->runningUnitTests()) {
                    break;
                }

                sleep(1);
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    /**
     * Get the count of unread notifications for the employer.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $unreadCount = $request->user()->unreadNotifications()->count();

        return $this->success([
            'unread_count' => $unreadCount,
        ], 'Unread notification count retrieved successfully');
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        try {
            $notification = $request->user()->notifications()->where('id', $id)->firstOrFail();
            $notification->markAsRead();

            return $this->success(
                new NotificationResource($notification),
                'Notification marked as read'
            );
        } catch (ModelNotFoundException) {
            return $this->notFound('Notification not found');
        }
    }

    /**
     * Mark all unread notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return $this->success(null, 'All notifications marked as read');
    }

    /**
     * Delete a specific notification.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        try {
            $notification = $request->user()->notifications()->where('id', $id)->firstOrFail();
            $notification->delete();

            return $this->deleted('Notification deleted successfully');
        } catch (ModelNotFoundException) {
            return $this->notFound('Notification not found');
        }
    }
}
