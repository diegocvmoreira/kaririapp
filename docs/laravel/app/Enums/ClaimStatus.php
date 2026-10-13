<?php

namespace App\Enums;

enum ClaimStatus: string
{
    case Pending = 'pending';
    case Reviewed = 'reviewed';
    case Approved = 'approved';
    case Rejected = 'rejected';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
