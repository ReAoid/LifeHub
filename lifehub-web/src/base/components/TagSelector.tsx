import { useState } from 'react'
import { useTagStore, type Tag } from '@/base/stores/tagStore'
import { cn } from '@/base/lib/utils'

interface TagSelectorProps {
  selectedTags: string[]
  onTagsChange: (tagIds: string[]) => void
  className?: string
}

export function TagSelector({ selectedTags, onTagsChange, className }: TagSelectorProps) {
  const { tags } = useTagStore()
  const [isOpen, setIsOpen] = useState(false)

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((id) => id !== tagId))
    } else {
      onTagsChange([...selectedTags, tagId])
    }
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 rounded-md border border-input px-3 py-2 text-sm"
      >
        {selectedTags.length === 0 ? (
          <span className="text-muted-foreground">Select tags...</span>
        ) : (
          <span>{selectedTags.length} selected</span>
        )}
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-64 rounded-md border bg-popover p-2 shadow-md">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={cn(
                'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent',
                selectedTags.includes(tag.id) && 'bg-accent',
              )}
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </button>
          ))}
          {tags.length === 0 && (
            <p className="p-2 text-sm text-muted-foreground">No tags yet</p>
          )}
        </div>
      )}
    </div>
  )
}
