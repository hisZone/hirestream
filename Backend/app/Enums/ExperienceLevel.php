<?php

declare(strict_types=1);

namespace App\Enums;

enum ExperienceLevel: string
{
    case ENTRY = 'entry';
    case MID = 'mid';
    case SENIOR = 'senior';
    case LEAD = 'lead';
    case EXECUTIVE = 'executive';

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
            self::ENTRY => 'Entry Level',
            self::MID => 'Mid Level',
            self::SENIOR => 'Senior Level',
            self::LEAD => 'Lead',
            self::EXECUTIVE => 'Executive',
        };
    }
}
