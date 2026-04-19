import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'


export function useTemplates() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select(`
          *,
          checklist_items:template_checklist_items(*),
          vignettes:template_vignettes(*)
        `)
      if (error) throw error
      return data
    },
  })
}
