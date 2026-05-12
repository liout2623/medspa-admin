<template>
  <div class="welcome-page">
    <!-- ===== Hero ===== -->
    <section class="hero">
      <div class="hero-overlay" />
      <div class="hero-content">
        <h1 class="hero-title">{{ t('hero.title') }}</h1>
        <p class="hero-subtitle">{{ t('hero.subtitle') }}</p>
        <button class="btn btn-hero" @click="scrollToServices">
          {{ t('hero.cta') }}
          <ChevronDown :size="18" />
        </button>
      </div>
      <button class="lang-toggle" @click="toggleLocale">
        <Globe :size="16" />
        <span>{{ locale === 'zh' ? 'English' : '中文' }}</span>
      </button>
    </section>

    <!-- ===== Culture ===== -->
    <section class="section culture-section animate-section">
      <div class="container">
        <h2 class="section-title">
          <Leaf :size="28" class="title-icon" />
          {{ t('culture.title') }}
        </h2>
        <p class="culture-text">{{ t('culture.content') }}</p>
      </div>
    </section>

    <!-- ===== Services ===== -->
    <section ref="servicesRef" class="section services-section animate-section">
      <div class="container">
        <h2 class="section-title">
          <Flame :size="28" class="title-icon" />
          {{ t('services.title') }}
        </h2>

        <!-- Loading -->
        <div v-if="servicesLoading" class="services-grid">
          <div v-for="i in 3" :key="i" class="service-card skeleton">
            <div class="skeleton-line long" />
            <div class="skeleton-line short" />
            <div class="skeleton-line medium" />
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="servicesError" class="services-empty">
          <AlertCircle :size="32" />
          <p>{{ servicesError }}</p>
        </div>

        <!-- Empty -->
        <div v-else-if="services.length === 0" class="services-empty">
          <PackageOpen :size="32" />
          <p>{{ t('services.title') }}</p>
        </div>

        <!-- Cards -->
        <div v-else class="services-grid">
          <div
            v-for="svc in services"
            :key="svc.id"
            class="service-card card"
          >
            <h3 class="service-name">{{ svc.name }}</h3>
            <div class="service-meta">
              <span class="service-price">¥{{ formatPrice(svc.price) }}</span>
              <span class="service-duration">
                <Clock :size="14" />
                {{ svc.durationMinutes }} min
              </span>
            </div>
            <p class="service-desc">{{ svc.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== Process ===== -->
    <section class="section process-section animate-section">
      <div class="container">
        <h2 class="section-title">
          <ClipboardCheck :size="28" class="title-icon" />
          {{ t('process.title') }}
        </h2>
        <div class="process-steps">
          <div
            v-for="(step, idx) in processSteps"
            :key="idx"
            class="step-item"
          >
            <div class="step-connector" v-if="idx > 0" />
            <div class="step-circle">
              <component :is="step.icon" :size="22" />
            </div>
            <h3 class="step-title">{{ t(step.titleKey) }}</h3>
            <p class="step-desc">{{ t(step.descKey) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== Contact ===== -->
    <section class="section contact-section animate-section">
      <div class="container">
        <h2 class="section-title">
          <MapPin :size="28" class="title-icon" />
          {{ t('contact.title') }}
        </h2>
        <div class="contact-grid">
          <div class="contact-info">
            <div class="contact-row">
              <MapPin :size="20" />
              <span>{{ t('contact.address') }}</span>
            </div>
            <div class="contact-row">
              <Phone :size="20" />
              <span>{{ t('contact.phone') }}</span>
            </div>
            <div class="contact-row">
              <Clock :size="20" />
              <span>{{ t('contact.hours') }}</span>
            </div>
          </div>
          <div class="contact-map card">
            <div class="map-placeholder">
              <Map :size="48" />
              <span>Map Placeholder</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== Footer ===== -->
    <footer class="footer">
      <div class="container footer-inner">
        <span>{{ t('footer.copyright') }}</span>
        <div class="footer-socials">
          <a href="#" aria-label="Social 1"><Globe :size="18" /></a>
          <a href="#" aria-label="Social 2"><Heart :size="18" /></a>
        </div>
      </div>
    </footer>

    <!-- AI Chat -->
    <CozeChat :locale="(locale as 'zh' | 'en')" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, markRaw } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ChevronDown, Globe, Leaf, Flame, Clock,
  ClipboardCheck, MapPin, Phone, Map,
  AlertCircle, PackageOpen, Calendar, Heart
} from 'lucide-vue-next'
import { listServices, type ServiceResponse } from '../../api/service'
import CozeChat from '../../components/coze/CozeChat.vue'

const { t, locale } = useI18n()

/* ── Language toggle ── */
function toggleLocale() {
  locale.value = locale.value === 'zh' ? 'en' : 'zh'
}

/* ── Scroll to services ── */
const servicesRef = ref<HTMLElement | null>(null)
function scrollToServices() {
  servicesRef.value?.scrollIntoView({ behavior: 'smooth' })
}

/* ── Services data ── */
const services = ref<ServiceResponse[]>([])
const servicesLoading = ref(true)
const servicesError = ref('')

onMounted(async () => {
  try {
    const res = await listServices({ page: 1, size: 100, active: true })
    services.value = res.data.data.items
  } catch {
    servicesError.value = '暂时无法加载服务信息'
  } finally {
    servicesLoading.value = false
  }
})

function formatPrice(price?: number) {
  if (price == null) return '0.00'
  return price.toFixed(2)
}

/* ── Process steps definition ── */
const processSteps = [
  { icon: markRaw(Calendar), titleKey: 'process.step1.title', descKey: 'process.step1.desc' },
  { icon: markRaw(ClipboardCheck), titleKey: 'process.step2.title', descKey: 'process.step2.desc' },
  { icon: markRaw(Flame), titleKey: 'process.step3.title', descKey: 'process.step3.desc' },
  { icon: markRaw(Heart), titleKey: 'process.step4.title', descKey: 'process.step4.desc' }
]

/* ── Intersection Observer for fade-in ── */
let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          observer?.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.15 }
  )
  document.querySelectorAll('.animate-section').forEach((el) => {
    observer?.observe(el)
  })
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<style scoped>
/* ========== Global page ========== */
.welcome-page {
  overflow-x: hidden;
  background: var(--bg);
  /*
   * Force light theme: WelcomePage is a public-facing showcase page.
   * Override all dark-mode CSS variables so it always renders in light mode
   * regardless of html.dark on the parent document.
   */
  --brand:#0f766e; --brand-dark:#115e59; --brand-light:#5eead4; --brand-end:#0d9488;
  --bg:#f8fafc; --bg-soft:#ffffff; --bg-elevated:#ffffff; --bg-subtle:#f8fafc; --bg-panel:#ffffff;
  --text:#334155; --text-strong:#0f172a; --text-muted:#64748b;
  --border:#dbe5e7; --border-strong:#cbd5e1; --border-soft:rgba(148,163,184,.14);
  --shadow:0 4px 20px rgba(0,0,0,.02),0 1px 3px rgba(0,0,0,.01);
  --shadow-lg:0 12px 30px rgba(15,118,110,.12);
  --input-bg:#f8fafc; --input-text:#1e293b;
  --table-head:#f1f5f9; --table-hover:#f8fafc;
  --overlay:rgba(0,0,0,.36);
  --danger:#e11d48; --danger-bg:rgba(244,63,94,.08); --danger-border:rgba(244,63,94,.3);
  --brand-bg:rgba(15,118,110,.08);
  color-scheme: light;
}

/* ========== Shared section ========== */
.section {
  padding: 80px 0;
}
.section-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-strong);
  margin-bottom: 40px;
  text-align: center;
}
.title-icon {
  color: var(--brand);
}

/* ========== Fade-in animation ========== */
.animate-section {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.animate-section.visible {
  opacity: 1;
  transform: translateY(0);
}

/* ========== Hero ========== */
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--brand-dark), var(--brand));
  overflow: hidden;
}
.hero-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 30% 40%, rgba(255,255,255,.08) 0%, transparent 70%);
}
.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 0 20px;
  color: #fff;
}
.hero-title {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 16px;
  letter-spacing: -0.01em;
}
.hero-subtitle {
  font-size: 1.15rem;
  opacity: 0.88;
  margin-bottom: 36px;
  line-height: 1.6;
  max-width: 600px;
  margin-inline: auto;
}
.btn-hero {
  padding: 14px 32px;
  font-size: 1rem;
  border-radius: 10px;
  background: rgba(255,255,255,.18);
  color: #fff;
  border: 1px solid rgba(255,255,255,.3);
  backdrop-filter: blur(4px);
  cursor: pointer;
  transition: all 0.25s ease;
}
.btn-hero:hover {
  background: rgba(255,255,255,.3);
  transform: translateY(-2px);
}

/* Language toggle */
.lang-toggle {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.3);
  background: rgba(255,255,255,.12);
  backdrop-filter: blur(6px);
  color: #fff;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.25s ease;
}
.lang-toggle:hover {
  background: rgba(255,255,255,.22);
}

/* ========== Culture ========== */
.culture-section {
  background: var(--bg-soft);
}
.culture-text {
  max-width: 780px;
  margin: 0 auto;
  font-size: 1.05rem;
  line-height: 1.9;
  color: var(--text);
  text-align: justify;
}

/* ========== Services ========== */
.services-section {
  background: var(--bg);
}
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}
.service-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.service-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
.service-name {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text-strong);
  margin: 0 0 12px;
}
.service-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}
.service-price {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--brand);
}
.service-duration {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--text-muted);
}
.service-desc {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin: 0;
  flex: 1;
}

/* Skeleton loading */
.skeleton {
  min-height: 180px;
  background: var(--bg-panel);
  border: 1px solid var(--border);
}
.skeleton-line {
  height: 14px;
  border-radius: 6px;
  background: var(--border);
  margin-bottom: 12px;
  animation: skeleton-pulse 1.4s ease infinite;
}
.skeleton-line.long  { width: 70%; }
.skeleton-line.short { width: 40%; }
.skeleton-line.medium { width: 55%; }
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Services empty / error */
.services-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 0;
  color: var(--text-muted);
  font-size: 0.95rem;
}

/* ========== Process ========== */
.process-section {
  background: var(--bg-soft);
}
.process-steps {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 0;
  flex-wrap: wrap;
}
.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1 1 200px;
  max-width: 260px;
  padding: 0 16px;
  position: relative;
}
.step-connector {
  position: absolute;
  top: 28px;
  left: -40px;
  width: 40px;
  height: 2px;
  background: var(--border-strong);
}
.step-connector::after {
  content: '';
  position: absolute;
  right: 0;
  top: -3px;
  border: 5px solid transparent;
  border-left-color: var(--brand);
}
.step-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--brand-bg);
  color: var(--brand);
  margin-bottom: 16px;
  border: 2px solid var(--brand-light);
  transition: background 0.25s ease, transform 0.25s ease;
}
.step-item:hover .step-circle {
  background: var(--brand);
  color: #fff;
  transform: scale(1.08);
}
.step-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-strong);
  margin: 0 0 8px;
}
.step-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.55;
  margin: 0;
  max-width: 220px;
}

/* ========== Contact ========== */
.contact-section {
  background: var(--bg);
}
.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: start;
}
.contact-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.contact-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
  color: var(--text);
}
.contact-row svg {
  color: var(--brand);
  flex-shrink: 0;
}
.contact-map {
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.map-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* ========== Footer ========== */
.footer {
  padding: 28px 0;
  background: var(--brand-dark);
  color: rgba(255,255,255,.75);
  font-size: 0.85rem;
}
.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.footer-socials {
  display: flex;
  gap: 16px;
}
.footer-socials a {
  color: rgba(255,255,255,.6);
  transition: color 0.2s ease;
}
.footer-socials a:hover {
  color: #fff;
}

/* ========== Responsive ========== */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  .hero-subtitle {
    font-size: 1rem;
  }
  .section {
    padding: 48px 0;
  }
  .section-title {
    font-size: 1.4rem;
  }
  .services-grid {
    grid-template-columns: 1fr;
  }
  .process-steps {
    flex-direction: column;
    align-items: center;
  }
  .step-connector {
    display: none;
  }
  .contact-grid {
    grid-template-columns: 1fr;
  }
  .footer-inner {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
  .lang-toggle {
    top: 16px;
    right: 16px;
    padding: 6px 12px;
    font-size: 0.8rem;
  }
}
</style>
