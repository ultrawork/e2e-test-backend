package com.ultrawork.notes.model

/**
 * Domain model representing a note.
 * Mapped from NoteDto; id is a UUID string from the backend API.
 */
data class Note(
    val id: String,
    val title: String,
    val content: String,
    val userId: String,
    val createdAt: String?,
    val updatedAt: String?
)
