<?php

declare(strict_types=1);

namespace App\Enums;

enum JobStatus: string
{
    case DRAFT = 'draft';
    case PENDING_APPROVAL = 'pending_approval';
    case PUBLISHED = 'published';
    case REJECTED = 'rejected';
    case CLOSED = 'closed';
    case EXPIRED = 'expired';

    /**
     * Get all values of the enum.
     *
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Human readable label.
     */
    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft',
            self::PENDING_APPROVAL => 'Pending Approval',
            self::PUBLISHED => 'Published',
            self::REJECTED => 'Rejected',
            self::CLOSED => 'Closed',
            self::EXPIRED => 'Expired',
        };
    }
}
