<script setup lang="ts">
useSeoMeta({
  title: 'Política de Privacidad',
  description:
    'Cómo el MISP protege y trata los datos personales de las personas usuarias del sitio Ministerio Abierto, conforme a la Ley Nº 25.326.'
})

const finalidades = [
  'Para facilitar la participación y la generación de un ecosistema de consulta ciudadana.',
  'Para enviar novedades sobre sus políticas públicas y servicios.',
  'Para responder consultas ingresadas en la plataforma.',
  'Para cumplir con las obligaciones que establecen las regulaciones competentes.',
  'Para mejorar, complementar y/o modificar nuestras políticas, proyectos y planificaciones.'
]
</script>

<template>
  <UPageHero
    title="Política de Privacidad"
    description="Cómo protegemos y tratamos tus datos personales en la plataforma Ministerio Abierto."
    :ui="{
        root: 'bg-linear-to-b from-primary/20 dark:from-secondary/30',
        title: 'text-primary dark:text-secondary',
        description: 'text-neutral-700 dark:text-neutral-300',
      container: 'sm:py-24 lg:py-16'
    }"
  >
  </UPageHero>
  <USeparator />
  <UContainer>
    <UPage>
      <UPageBody>
        <div class="max-w-3xl mx-auto py-12 space-y-12">
          <section>
            <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
              La presente Política de Privacidad tiene por objeto cumplir con la Ley Nacional de Protección de
              Datos Personales Nº 25.326 (la “LPDP”) y sus normas reglamentarias dictadas por la Agencia de
              Acceso a la Información Pública (la “AAIP”). El MISP respeta la privacidad de las personas
              usuarias que naveguen o se registren en el sitio web Ministerio Abierto (en adelante, el
              “Sitio”).
            </p>
            <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
              Se recomienda la lectura de la presente Política de Privacidad para conocer el tratamiento de
              los datos personales recolectados en esta plataforma. El registro de datos de las personas
              usuarias en la plataforma brinda consentimiento para su uso tal como es explicitado en este
              documento.
            </p>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              El MISP es el responsable del tratamiento de los datos personales.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-primary mb-4">Finalidades y forma de recolección</h2>
            <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
              El MISP recolectará los siguientes datos: nombre y apellido y correo electrónico, municipio,
              teléfono de contacto e institución u organización que representa (en adelante, los “Datos
              Personales”) que las personas usuarias proporcionan al hacer una consulta en el Sitio.
            </p>
            <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
              El MISP utilizará los Datos Personales para los siguientes fines:
            </p>
            <ul class="space-y-2 leading-7 text-neutral-700 dark:text-neutral-300">
              <li
                v-for="(finalidad, index) in finalidades"
                :key="index"
                class="flex gap-3"
              >
                <UIcon name="lucide:check" class="size-5 text-primary shrink-0 mt-1" />
                <span>{{ finalidad }}</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-primary mb-4">Deberes y derechos del usuario</h2>
            <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
              Tanto los Datos Personales brindados por la persona usuaria en su registro como su actualización
              son de exclusiva responsabilidad de la persona usuaria, quien responderá de todo perjuicio que
              pueda derivarse de la falta de veracidad o inexactitud en la información entregada al MISP.
            </p>
            <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
              Toda persona usuaria tiene derecho a requerir el acceso, rectificación, actualización y/o
              eliminación de sus Datos Personales enviando un mail a
              <a
                href="mailto:mesadeayuda@minfra.gba.gob.ar"
                class="text-primary hover:underline"
              >mesadeayuda@minfra.gba.gob.ar</a>
              con un requerimiento en este sentido, previa acreditación de su identidad.
            </p>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              El tratamiento de los datos personales se realiza con base en el consentimiento prestado por la
              persona usuaria y, cuando corresponda, en el ejercicio de competencias y funciones legalmente
              atribuidas al Ministerio.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-primary mb-4">
              Seguridad y confidencialidad de los datos personales
            </h2>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              El MISP trata con confidencialidad los Datos Personales proporcionados y adoptará las medidas de
              seguridad necesarias para amparar estos datos de conformidad con la normativa vigente y las
              recomendaciones establecidas por la AAIP.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-primary mb-4">Conservación de los datos personales</h2>
            <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
              El MISP conservará los datos personales durante el tiempo necesario para la realización de las
              finalidades para las que fueron recolectados. Posteriormente, en caso de ser necesario, se
              conservará la información durante el período necesario para cubrir posibles responsabilidades.
            </p>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              Los datos personales no serán cedidos ni comunicados a terceros, salvo obligación legal,
              requerimiento judicial o cuando resulte necesario para el cumplimiento de las finalidades
              informadas.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-primary mb-4">Comunicaciones del MISP</h2>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              En caso de que la persona usuaria no desee seguir recibiendo correos electrónicos, podrá
              desuscribirse cambiando sus preferencias de e-mail siguiendo las instrucciones que proporcionamos
              en nuestras comunicaciones.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-primary mb-4">Actualización de la Política de Privacidad</h2>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              El MISP podrá actualizar esta Política de Privacidad cuando se considere oportuno, en cuyo caso
              publicaremos los cambios en el presente sitio web. Por ello, encomendamos revisar el sitio de
              forma periódica.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-primary mb-4">Reclamo</h2>
            <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
              La Agencia de Acceso a la Información Pública (AAIP) en su carácter de órgano de control de la
              Ley de Protección de Datos Personales, tiene la atribución de atender las denuncias y reclamos
              que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas
              vigentes en materia de protección de datos personales.
            </p>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos
              en forma gratuita a intervalos no inferiores a seis meses, salvo que acredite un interés legítimo
              al efecto, conforme lo establecido por el artículo 14 inciso 3 de la Ley 25.326.
            </p>
          </section>

          <section>
            <h2 class="text-2xl font-bold text-primary mb-4">Contacto</h2>
            <p class="mb-4 leading-7 text-neutral-700 dark:text-neutral-300">
              El MISP, con domicilio en Calle 7 N° 1267, e/ 58 y 59, La Plata (1900), es la encargada de
              recolectar, usar y procesar los datos personales de conformidad con esta Política de Privacidad.
            </p>
            <p class="leading-7 text-neutral-700 dark:text-neutral-300">
              En caso de tener alguna duda o consulta sobre esta Política de Privacidad contáctenos a
              <a
                href="mailto:mesadeayuda@minfra.gba.gob.ar"
                class="text-primary hover:underline"
              >mesadeayuda@minfra.gba.gob.ar</a>.
            </p>
          </section>

          <USeparator />

          <p class="text-sm text-muted">
            Esta Política de Privacidad fue actualizada por última vez el 14 de julio de 2026.
          </p>
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
