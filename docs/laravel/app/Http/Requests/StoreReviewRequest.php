<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Exige usuário autenticado via Sanctum
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'place_id' => ['required', 'integer', 'exists:places,id'],
            'rating'   => ['required', 'integer', 'min:1', 'max:5'],
            'comment'  => ['required', 'string', 'min:10', 'max:1500'],
        ];
    }

    public function messages(): array
    {
        return [
            'place_id.required' => 'O local a ser avaliado é obrigatório.',
            'place_id.exists'   => 'O local informado não existe no catálogo.',
            'rating.required'   => 'A nota é obrigatória.',
            'rating.min'        => 'A nota mínima permitida é 1 estrela.',
            'rating.max'        => 'A nota máxima permitida é 5 estrelas.',
            'comment.required'  => 'O comentário é obrigatório.',
            'comment.min'       => 'O comentário deve ter no mínimo 10 caracteres para enriquecer a comunidade.',
            'comment.max'       => 'O comentário não pode ultrapassar 1500 caracteres.',
        ];
    }
}
