package com.ultrawork.notes.data.remote

/**
 * DTO matching the backend API contract for a note resource.
 */
data class NoteDto(
    val id: String,
    val title: String,
    val content: String,
    val userId: String,
    val createdAt: String?,
    val updatedAt: String?
)

/**
 * Request body for POST /api/notes.
 */
data class CreateNoteRequest(
    val title: String,
    val content: String
)
