import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { useTagStore, type Tag } from '@/base/stores/tagStore'

export default function TagsPage() {
  const { tags, isLoading, fetchTags, createTag, updateTag, deleteTag } = useTagStore()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')

  useEffect(() => {
    fetchTags()
  }, [])

  const handleCreate = async () => {
    if (!name.trim()) return
    await createTag(name.trim(), color)
    setName('')
    setColor('#6366f1')
    setIsCreating(false)
  }

  const handleUpdate = async (id: string) => {
    if (!name.trim()) return
    await updateTag(id, { name: name.trim(), color })
    setEditingId(null)
    setName('')
    setColor('#6366f1')
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this tag?')) {
      await deleteTag(id)
    }
  }

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id)
    setName(tag.name)
    setColor(tag.color)
  }

  const colors = [
    '#6366f1', '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#78716c',
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tags</h1>
        <button
          onClick={() => {
            setIsCreating(true)
            setName('')
            setColor('#6366f1')
          }}
          className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Tag
        </button>
      </div>

      {/* Create / Edit Form */}
      {(isCreating || editingId) && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Tag name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Color</label>
              <div className="mt-1 flex gap-1">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full border-2 ${
                      color === c ? 'border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={editingId ? () => handleUpdate(editingId) : handleCreate}
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setEditingId(null)
                }}
                className="rounded-md border px-3 py-2 text-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag List */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
        ) : tags.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No tags yet. Create your first tag!
          </div>
        ) : (
          <div className="divide-y">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm font-medium">{tag.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(tag)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
