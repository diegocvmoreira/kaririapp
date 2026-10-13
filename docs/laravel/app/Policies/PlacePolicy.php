<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Place;
use App\Enums\UserRole;

class PlacePolicy
{
    /**
     * Administrador tem autorização universal
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->role === UserRole::Admin->value) {
            return true;
        }

        return null;
    }

    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Place $place): bool
    {
        if ($place->status === 'published') {
            return true;
        }

        return $user && ($user->id === $place->owner_id || $user->role === UserRole::Admin->value);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [UserRole::Admin->value, UserRole::Business->value], true);
    }

    public function update(User $user, Place $place): bool
    {
        return $user->id === $place->owner_id || $user->role === UserRole::Admin->value;
    }

    public function delete(User $user, Place $place): bool
    {
        return $user->role === UserRole::Admin->value;
    }

    public function publish(User $user): bool
    {
        return $user->role === UserRole::Admin->value;
    }
}
