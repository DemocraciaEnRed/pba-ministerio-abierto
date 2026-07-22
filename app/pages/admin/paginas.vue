<script setup lang="ts">
definePageMeta({
  layout: 'admin-control-panel',
  middleware: 'platform-admin'
})

usePrivatePageSeo('Páginas')

interface AdminPage {
  id: number
  pageKey: string
  title: string
  slug: string
  content: string | null
  isPublished: boolean
  updatedAt: string
}

const toast = useToast()

const form = reactive({
  pageKey: '',
  title: '',
  slug: '',
  content: '',
  isPublished: false
})

const editingSlug = ref<string | null>(null)
const saving = ref(false)
const deletingSlug = ref<string | null>(null)

// `useRequestFetch` reenvía la cookie de sesión durante el SSR para que el
// backend resuelva la vista admin del usuario logueado.
const requestFetch = useRequestFetch()
const { data: pages, status, refresh } = await useAsyncData('admin-pages', () =>
  requestFetch<AdminPage[]>('/api/pages')
)

function resetForm() {
  editingSlug.value = null
  form.pageKey = ''
  form.title = ''
  form.slug = ''
  form.content = ''
  form.isPublished = false
}

function editPage(page: AdminPage) {
  editingSlug.value = page.slug
  form.pageKey = page.pageKey
  form.title = page.title
  form.slug = page.slug
  form.content = page.content ?? ''
  form.isPublished = page.isPublished
}

function getPagePath(slug: string) {
  return `/api/pages/${encodeURIComponent(slug)}`
}

async function savePage() {
  saving.value = true

  try {
    if (editingSlug.value) {
      await $fetch(getPagePath(editingSlug.value), {
        method: 'PUT',
        body: {
          title: form.title,
          slug: form.slug,
          content: form.content || null,
          isPublished: form.isPublished
        }
      })
    } else {
      await $fetch('/api/pages', {
        method: 'POST',
        body: {
          pageKey: form.pageKey,
          title: form.title,
          slug: form.slug,
          content: form.content || null,
          isPublished: form.isPublished
        }
      })
    }

    toast.add({
      title: editingSlug.value ? 'Página actualizada' : 'Página creada',
      color: 'success'
    })

    resetForm()
    await refresh()
  } catch (error) {
    const e = error as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'No se pudo guardar',
      description: e.data?.message || e.message || 'Ocurrió un error inesperado.',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

async function removePage(page: AdminPage) {
  deletingSlug.value = page.slug

  try {
    await $fetch(getPagePath(page.slug), { method: 'DELETE' })
    toast.add({
      title: 'Página eliminada',
      color: 'success'
    })
    if (editingSlug.value === page.slug) {
      resetForm()
    }
    await refresh()
  } catch (error) {
    const e = error as { data?: { message?: string }, message?: string }
    toast.add({
      title: 'No se pudo eliminar',
      description: e.data?.message || e.message || 'Ocurrió un error inesperado.',
      color: 'error'
    })
  } finally {
    deletingSlug.value = null
  }
}
</script>

<template>
  <UPage>
    <UPageHeader
      title="Páginas institucionales"
      description="Creá y gestioná contenido estático público."
    />

    <UPageBody>
      <UPageCard class="space-y-4">
        <p class="font-medium">
          {{ editingSlug ? 'Editar página' : 'Nueva página' }}
        </p>

        <div class="grid gap-4 md:grid-cols-2">
          <UFormField
            label="Clave (pageKey)"
            required
          >
            <UInput
              v-model="form.pageKey"
              :disabled="Boolean(editingSlug)"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Slug"
            required
          >
            <UInput
              v-model="form.slug"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Título"
            required
            class="md:col-span-2"
          >
            <UInput
              v-model="form.title"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Contenido HTML"
            class="md:col-span-2"
          >
            <UTextarea
              v-model="form.content"
              :rows="8"
              class="w-full"
            />
          </UFormField>
        </div>

        <UCheckbox
          v-model="form.isPublished"
          label="Publicada"
        />

        <div class="flex gap-2 justify-end">
          <UButton
            v-if="editingSlug"
            label="Cancelar"
            color="neutral"
            variant="ghost"
            @click="resetForm"
          />
          <UButton
            :label="editingSlug ? 'Guardar cambios' : 'Crear página'"
            icon="i-lucide-save"
            :loading="saving"
            @click="savePage"
          />
        </div>
      </UPageCard>

      <UPageCard v-if="status === 'pending'">
        Cargando páginas...
      </UPageCard>

      <UPageCard v-else>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left border-b border-default">
                <th class="py-2 pr-2">
                  Título
                </th>
                <th class="py-2 pr-2">
                  Slug
                </th>
                <th class="py-2 pr-2">
                  Estado
                </th>
                <th class="py-2">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="page in pages || []"
                :key="page.id"
                class="border-b border-default"
              >
                <td class="py-2 pr-2">
                  {{ page.title }}
                </td>
                <td class="py-2 pr-2">
                  {{ page.slug }}
                </td>
                <td class="py-2 pr-2">
                  <UBadge
                    :label="page.isPublished ? 'Publicada' : 'Borrador'"
                    :color="page.isPublished ? 'success' : 'neutral'"
                    variant="subtle"
                  />
                </td>
                <td class="py-2">
                  <div class="flex gap-2">
                    <UButton
                      label="Editar"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      @click="editPage(page)"
                    />
                    <UButton
                      label="Eliminar"
                      color="error"
                      variant="ghost"
                      size="xs"
                      :loading="deletingSlug === page.slug"
                      @click="removePage(page)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UPageCard>
    </UPageBody>
  </UPage>
</template>
