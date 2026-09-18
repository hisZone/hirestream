<?php

declare(strict_types=1);

namespace App\Enums;

enum ApplicationStatus: string
{
    case SUBMITTED = 'submitted';
    case UNDER_REVIEW = 'under_review';
    case SHORTLISTED = 'shortlisted';
    case REJECTED = 'rejected';
    case HIRED = 'hired';
}
