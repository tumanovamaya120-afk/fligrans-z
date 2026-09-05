import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  ShieldCheck,
  Zap,
  Layers,
  Smartphone,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export const FeaturesAndFaq: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const steps = [
    {
      step: '01',
      title: 'Linki Kopyalayın',
      desc: 'Instagram Reels, TikTok veya YouTube Shorts uygulamasından indirmek istediğiniz videonun bağlantısını kopyalayın.',
    },
    {
      step: '02',
      title: 'Kutuya Yapıştırın',
      desc: 'Kopyaladığınız bağlantıyı yukarıdaki arama kutusuna yapıştırın ve "İndir" butonuna tıklayın.',
    },
    {
      step: '03',
      title: 'Cihazınıza Kaydedin',
      desc: 'Filigransız HD MP4 video veya MP3 ses formatını seçerek saniyeler içinde telefonunuza veya bilgisayarınıza indirin.',
    },
  ];

  const features = [
    {
      icon: Zap,
      title: 'Filigransız & HD Kalite',
      desc: 'TikTok ve Shorts videolarını orijinal 1080p çözünürlükte ve logo olmadan indirin.',
    },
    {
      icon: ShieldCheck,
      title: 'Tamamen Güvenli & Ücretsiz',
      desc: 'Kayıt olmak, giriş yapmak veya program yüklemek gerekmez. Sınırsız ve anonimdir.',
    },
    {
      icon: Smartphone,
      title: 'Tüm Cihazlarla Uyumlu',
      desc: 'iPhone (Safari), Android (Chrome), tablet ve masaüstü bilgisayarlarda sorunsuz çalışır.',
    },
    {
      icon: Layers,
      title: 'Video ve MP3 Desteği',
      desc: 'Videoların yanı sıra arka plan müziklerini ve orijinal sesleri MP3 formatında kaydedin.',
    },
  ];

  const faqs = [
    {
      q: 'İndirilen TikTok videolarında filigran (logo) kalır mı?',
      a: 'Hayır, sistemimiz TikTok videolarındaki kullanıcı adı ve TikTok logosunu otomatik olarak kaldırır; videoyu tamamen temiz ve filigransız olarak sunar.',
    },
    {
      q: 'Instagram Reels videolarını nasıl indirebilirim?',
      a: 'Instagram uygulamasında Reels videosunun altındaki Paylaş (Uçak) simgesine dokunun ve "Bağlantıyı Kopyala"yı seçin. Ardından buradaki kutuya yapıştırıp indirin. Profilin herkese açık (public) olması gerekir.',
    },
    {
      q: 'YouTube Shorts videolarını MP3 olarak indirebilir miyim?',
      a: 'Evet! İndirme seçeneklerinde hem HD MP4 video hem de yalnızca ses içeren yüksek kaliteli MP3 seçeneği mevcuttur.',
    },
    {
      q: 'iPhone / iPad (iOS) cihazıma nasıl video kaydederim?',
      a: 'Safari tarayıcısında "İndir" butonuna dokunduğunuzda Safari dosyayı indirir. İndirilenler simgesine dokunup videoyu açabilir ve "Videoyu Kaydet" seçeneği ile Galeri / Fotoğraflar uygulamanıza aktarabilirsiniz.',
    },
    {
      q: 'Herhangi bir indirme sınırı veya ücret var mı?',
      a: 'Hayır, servisimiz tamamen ücretsizdir ve günlük indirme sayısı konusunda herhangi bir sınır yoktur.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section id="features-faq" className="mt-16 w-full max-w-5xl space-y-16">
      {/* 3 Steps Guide */}
      <div>
        <div className="text-center">
          <span className="rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            Kolay & Hızlı Kullanım
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            3 Kolay Adımda Video İndirin
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Program veya eklenti yüklemeden doğrudan tarayıcınızdan indirin.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="relative flex flex-col rounded-2xl border border-white/[0.07] bg-[#0e0e11]/80 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md transition-all hover:border-white/[0.18] hover:bg-[#121217]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                {item.step}
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div>
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Neden Bizi Tercih Etmelisiniz?
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="flex flex-col rounded-2xl border border-white/[0.06] bg-[#0d0d10]/80 p-5 shadow-[0_8px_25px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:border-white/[0.14] hover:bg-[#121216]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16161a] border border-white/[0.06] text-emerald-400 shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="mt-3 text-sm font-semibold text-white">{feat.title}</h4>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#0e0e12]/90 p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="h-5 w-5 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Yardım & Destek
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white">Sıkça Sorulan Sorular</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Video indirme hakkında merak ettiğiniz tüm detaylar.
        </p>

        <div className="mt-6 divide-y divide-white/[0.06]">
          {faqs.map((faq, idx) => (
            <div key={idx} className="py-4">
              <button
                onClick={() => toggleFaq(idx)}
                className="flex w-full items-center justify-between text-left text-sm font-medium text-white transition-colors hover:text-emerald-400"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 flex-shrink-0 text-zinc-400 transition-transform duration-200 ${
                    openFaq === idx ? 'rotate-180 text-emerald-400' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
