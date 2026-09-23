<script setup lang="ts">
usePageSeo({
  title: 'Acerca de',
  description:
    'Ministerio Abierto es una iniciativa del Ministerio de Infraestructura y Servicios Públicos de la Provincia de Buenos Aires para fortalecer la participación ciudadana.',
  url: '/acerca-de'
})
</script>

<template>
  <div>
    <UPageHero
      title="Acerca de"
      description="Ministerio Abierto reúne información, participación y diálogo entre el Estado y la ciudadanía."
      :ui="{
        root: 'bg-linear-to-b from-primary/20 dark:from-secondary/30',
        title: 'text-primary dark:text-secondary',
        description: 'text-neutral-700 dark:text-neutral-300',
        container: 'sm:py-24 lg:py-16'
      }"
    />
    <USeparator />
    <UContainer>
      <UPage>
        <UPageBody>
          <div class="max-w-3xl mx-auto py-12 space-y-12">
            <section>
              <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
                <strong class="font-bold text-primary">MINISTERIO ABIERTO</strong> es una iniciativa del
                Ministerio de Infraestructura y Servicios Públicos de la Provincia de Buenos Aires (MISP),
                creada en el marco del Plan de Fortalecimiento Institucional 2024–2027 (PFI) aprobado por
                <a
                  href="https://normas.gba.gob.ar/ar-b/resolucion/2024/1123/464786"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary hover:underline"
                >Resolución Nº 1123/2024</a>.
              </p>

              <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
                El PFI impulsa un proceso de fortalecimiento y transformación institucional orientado a
                desarrollar las capacidades del MISP para planificar, gestionar e implementar políticas públicas
                de manera más abierta, participativa, transparente y cercana a la ciudadanía.
              </p>

              <p class="leading-7 text-neutral-700 dark:text-neutral-300">
                En este marco, esta herramienta digital reúne y articula distintas instancias de información,
                participación y diálogo entre el Estado y la ciudadanía. Facilita el acceso a información
                pública y permite realizar consultas y aportes, participar en distintos espacios y hacer
                seguimiento de las políticas, obras y servicios públicos.
              </p>

              <p class="mt-4 leading-7 text-neutral-700 dark:text-neutral-300">
                De esta forma, la iniciativa promueve una gestión que construye conocimiento junto con quienes
                habitan, estudian y conocen los territorios, fortaleciendo la capacidad institucional para
                responder a las necesidades de la Provincia.
              </p>

              <p class="mt-4 leading-7 text-neutral-700 dark:text-neutral-300">
                Ministerio Abierto se articula con el Programa de Integridad, Transparencia y Gobierno Abierto,
                creado mediante la
                <a
                  href="https://boletinoficial.gba.gob.ar/secciones/13162/ver#page=5"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary hover:underline"
                >Resolución Nº 1225/2024</a>
                que apunta a promover una cultura de gobierno abierto centrada en la ciudadanía. En este
                marco, Ministerio Abierto es una iniciativa innovadora que habilita la participación de la
                ciudadanía y las partes interesadas para robustecer la confianza en la gestión de la obra
                pública y los servicios públicos.
              </p>
            </section>

            <section>
              <h2 class="text-2xl font-bold text-primary mb-4">
                Herramientas e instancias de participación
              </h2>

              <ul class="space-y-3 leading-7 text-neutral-700 dark:text-neutral-300">
                <li class="flex gap-3">
                  <UIcon
                    name="lucide:check"
                    class="size-5 text-primary shrink-0 mt-1"
                  />
                  <span>
                    <strong class="font-bold text-primary">Audiencias públicas:</strong>
                    accedé a información sobre los proyectos, realizá consultas y aportá observaciones antes de
                    la toma de decisiones.
                  </span>
                </li>
                <li class="flex gap-3">
                  <UIcon
                    name="lucide:check"
                    class="size-5 text-primary shrink-0 mt-1"
                  />
                  <span>
                    <strong class="font-bold text-primary">Consultas públicas:</strong>
                    conocé los proyectos, sus características e impactos, y compartí opiniones, observaciones y
                    aportes.
                  </span>
                </li>
                <li class="flex gap-3">
                  <UIcon
                    name="lucide:check"
                    class="size-5 text-primary shrink-0 mt-1"
                  />
                  <span>
                    <strong class="font-bold text-primary">Obras y proyectos en diálogo:</strong>
                    conocé las obras y proyectos en tu región y participá de espacios de información, consulta
                    e intercambio.
                  </span>
                </li>
                <li class="flex gap-3">
                  <UIcon
                    name="lucide:check"
                    class="size-5 text-primary shrink-0 mt-1"
                  />
                  <span>
                    <strong class="font-bold text-primary">Encuentros Regionales:</strong>
                    participá de mesas de trabajo para aportar a la agenda de infraestructura y desarrollo de tu
                    región.
                  </span>
                </li>
                <li class="flex gap-3">
                  <UIcon
                    name="lucide:check"
                    class="size-5 text-primary shrink-0 mt-1"
                  />
                  <span>
                    <strong class="font-bold text-primary">Observatorio de Obras y Servicios Públicos:</strong>
                    conocé el espacio de participación y control ciudadano que reúne a más de 50 instituciones
                    del sector.
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 class="text-2xl font-bold text-primary mb-4">
                ¿Qué se propone desde Ministerio Abierto?
              </h2>

              <div class="space-y-6">
                <div>
                  <h3 class="text-xl font-bold text-primary mb-2">
                    Compartir información pública
                  </h3>
                  <p class="leading-7 text-neutral-700 dark:text-neutral-300">
                    Garantizar información clara, accesible y abierta sobre políticas, obras, proyectos y
                    recursos destinados a la infraestructura y los servicios públicos.
                  </p>
                </div>

                <div>
                  <h3 class="text-xl font-bold text-primary mb-2">
                    Escuchar e identificar necesidades
                  </h3>
                  <p class="leading-7 text-neutral-700 dark:text-neutral-300">
                    Generar canales de diálogo que permitan conocer las demandas, experiencias y prioridades de
                    las comunidades y los territorios.
                  </p>
                </div>

                <div>
                  <h3 class="text-xl font-bold text-primary mb-2">
                    Construir acuerdos
                  </h3>
                  <p class="leading-7 text-neutral-700 dark:text-neutral-300">
                    Promover espacios de intercambio entre el Estado, la ciudadanía, universidades,
                    organizaciones y otros actores para incorporar distintas perspectivas en las políticas
                    públicas.
                  </p>
                </div>

                <div>
                  <h3 class="text-xl font-bold text-primary mb-2">
                    Rendir cuentas y hacer seguimiento
                  </h3>
                  <p class="leading-7 text-neutral-700 dark:text-neutral-300">
                    Facilitar el acceso a información que permita conocer los avances, resultados y compromisos
                    asumidos por el Ministerio.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </UPageBody>
      </UPage>
    </UContainer>
  </div>
</template>
