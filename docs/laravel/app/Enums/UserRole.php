<?php

namespace App\Enums;

enum UserRole: string
{
    case Visitor = 'visitor';
    case User = 'user';
    case Business = 'business';
    case Admin = 'admin';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
