<script setup lang="ts">
useSeoMeta({
  title: 'Términos y Condiciones',
  description:
    'Marco legal y condiciones para el acceso, registro y uso de la plataforma Ministerio Abierto.'
})

const conductasProhibidas = [
  'Hostigar, acosar, amenazar o discriminar a otras personas usuarias.',
  'Publicar contenidos ofensivos, violentos, racistas, sexistas, capacitistas o que promuevan el odio.',
  'Publicar información falsa con intención de engañar.',
  'Suplantar la identidad de otra persona o entidad.',
  'Solicitar o divulgar datos personales de terceros sin consentimiento.',
  'Difundir contenido pornográfico, obsceno o ilegal.',
  'Realizar acciones que afecten la seguridad o el funcionamiento de la plataforma.'
]
</script>

<template>
  <UPageHero
    title="Términos y Condiciones"
    description="Marco legal y condiciones para participar en la plataforma Ministerio Abierto."
  :ui="{
        root: 'bg-linear-to-b from-primary/20 dark:from-secondary/30',
        title: 'text-primary dark:text-secondary',
        description: 'text-neutral-700 dark:text-neutral-300',
      container: 'sm:py-16 lg:py-16'
    }"
  />
  <USeparator />
  <UContainer>
    <UPage>
      <UPageBody>
        <div class="max-w-3xl mx-auto py-12 space-y-12">
          <section>
            <h2 class="text-2xl font-bold text-primary mb-4">Objeto y aceptación</h2>
            <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
              Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma digital
              Ministerio Abierto, un sitio web que brinda información y habilita espacios de participación,
              diálogo y deliberación ciudadana en el marco del Programa de Integridad, Transparencia y
              Gobierno Abierto del Ministerio de Infraestructura y Servicios Públicos (MISP) de la Provincia
              de Buenos Aires.
            </p>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              La plataforma es administrada por el MISP. El registro, acceso y uso de la plataforma por parte
              de las personas usuarias implica la aceptación plena y sin reservas de estos Términos y
              Condiciones y de la Política de Privacidad vigente.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-primary mb-4">Registro, acceso y uso</h2>
            <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
              El acceso al sitio web es libre y gratuito. Para participar activamente (comentar, opinar, votar
              o interactuar en consultas), se requiere inscripción previa mediante un formulario digital. La
              información proporcionada por la persona usuaria al momento del registro estará protegida
              mediante credenciales de acceso personales y solo podrá ser modificada por la propia persona
              usuaria.
            </p>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              La administración del sitio se reserva el derecho de verificar la información brindada y de
              rechazar o cancelar registros cuando la información sea falsa, incompleta o no verificable.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-primary mb-4">Requisito de edad</h2>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              La plataforma está destinada exclusivamente a personas mayores de 16 años. Al registrarse, la
              persona usuaria declara y garantiza cumplir con este requisito. La administración no asume
              responsabilidad por registros realizados con información falsa sobre la edad.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-primary mb-4">Obligaciones de la persona usuaria</h2>
            <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
              Al registrarse, la persona usuaria se compromete a no proporcionar información falsa ni crear
              cuentas a nombre de terceros sin autorización, no crear más de una cuenta personal, mantener
              actualizada su información de contacto, no compartir su contraseña ni permitir el acceso de
              terceros a su cuenta y notificar de inmediato a la administración ante cualquier uso no
              autorizado de su cuenta.
            </p>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              La persona usuaria es la única responsable por la actividad realizada desde su cuenta. La
              administración se reserva el derecho de rechazar solicitudes de inscripción o cancelar registros
              previamente aceptados.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-primary mb-4">Responsabilidad sobre los contenidos</h2>
            <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
              La persona usuaria se compromete a utilizar la plataforma de manera lícita, respetuosa y
              conforme a estos Términos y Condiciones. Todo contenido publicado (opiniones, comentarios,
              votos, aportes o intervenciones) es responsabilidad exclusiva de la persona usuaria que lo
              genera, quien garantiza que dicho contenido no vulnera derechos de terceros, no viola normas
              legales vigentes ni infringe estos Términos y Condiciones ni la Política de Privacidad.
            </p>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              La plataforma no garantiza que el contenido publicado haya sido revisado previamente y no asume
              responsabilidad por el uso que terceros hagan de dicho contenido. Los aportes realizados en la
              plataforma no son vinculantes ni obligatorios para autoridades u organismos públicos y tienen
              carácter consultivo, deliberativo y participativo.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-primary mb-4">Conductas prohibidas</h2>
            <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
              Quedan expresamente prohibidas las siguientes conductas:
            </p>
            <ul class="mb-4 space-y-2 leading-7 text-neutral-700 dark:text-neutral-300">
              <li
                v-for="(conducta, index) in conductasProhibidas"
                :key="index"
                class="flex gap-3"
              >
                <UIcon name="lucide:x" class="size-5 text-error shrink-0 mt-1" />
                <span>{{ conducta }}</span>
              </li>
            </ul>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              Ante estas situaciones, las personas usuarias podrán comunicarse con la administración a través
              de
              <a
                href="mailto:mesadeayuda@minfra.gba.gob.ar"
                class="text-primary hover:underline"
              >mesadeayuda@minfra.gba.gob.ar</a>.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-primary mb-4">Moderación</h2>
            <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
              La plataforma cuenta con mecanismos de moderación para garantizar un espacio de diálogo
              respetuoso y seguro. La administración podrá remover contenidos o suspender cuentas que
              incumplan estos Términos y Condiciones, sin necesidad de notificación previa.
            </p>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              Se promueve un debate abierto y plural, evitando agresiones personales, desinformación, spam o
              desvíos del propósito participativo de la plataforma.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-primary mb-4">Disponibilidad del servicio</h2>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              La plataforma no garantiza la disponibilidad permanente del sitio ni la ausencia de errores
              técnicos, virus u otros elementos dañinos. El uso de la plataforma y de los recursos disponibles
              en Internet es responsabilidad exclusiva de la persona usuaria.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-primary mb-4">Ley aplicable y jurisdicción</h2>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              Estos Términos y Condiciones se rigen por las leyes de la República Argentina. Cualquier
              controversia derivada del uso de la plataforma será sometida a la jurisdicción de los Tribunales
              en lo Contencioso Administrativo del Departamento Judicial de La Plata, renunciando a cualquier
              otro fuero.
            </p>
          </section>
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
