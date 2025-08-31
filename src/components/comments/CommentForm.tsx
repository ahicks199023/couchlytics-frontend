'use client'

import { useState } from 'react'

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>
  placeholder?: string
  submitText?: string
  isSubmitting?: boolean
  className?: string
}

export default function CommentForm({ 
  onSubmit, 
  placeholder = "Write a comment...", 
  submitText = "Post Comment",
  isSubmitting = false,
  className = ""
}: CommentFormProps) {
  const [content, setContent] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return
    
    try {
      await onSubmit(content)
      setContent('')
    } catch (error) {
      console.error('Error submitting comment:', error)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className={`comment-form ${className}`}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        disabled={isSubmitting}
        className="comment-textarea"
        required
      />
      <div className="form-actions">
        <button 
          type="submit" 
          disabled={!content.trim() || isSubmitting}
          className="submit-btn"
        >
          {isSubmitting ? 'Posting...' : submitText}
        </button>
      </div>
    </form>
  )
}
