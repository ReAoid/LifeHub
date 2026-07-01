import { useEffect } from 'react'
import { useTagStore } from '@/base/stores/tagStore'

export function useTags() {
  const { tags, isLoading, fetchTags } = useTagStore()

  useEffect(() => {
    if (tags.length === 0) {
      fetchTags()
    }
  }, [])

  return { tags, isLoading }
}
