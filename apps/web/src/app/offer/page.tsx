import Link from 'next/link'

export const metadata = {
  title: 'Публичная оферта — Lessonify',
}

export default function OfferPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-bold text-lg text-foreground">Lessonify</span>
          </Link>
          <span className="text-border">|</span>
          <span className="text-muted-foreground text-sm">Публичная оферта</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Публичная оферта</h1>
        <p className="text-muted-foreground text-sm mb-10">Дата публикации: 3 апреля 2026 г.</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">1. Общие положения</h2>
            <p>1.1. Настоящая публичная оферта (далее — «Оферта») является официальным предложением самозанятого Жукова Ивана Андреевича, ИНН 434566912109 (далее — «Исполнитель»), адресованным любому физическому лицу (далее — «Пользователь»), заключить договор на условиях, изложенных ниже.</p>
            <p className="mt-3">1.2. Оферта считается акцептованной с момента регистрации Пользователя в сервисе Lessonify (далее — «Сервис») и/или оплаты подписки.</p>
            <p className="mt-3">1.3. Исполнитель оставляет за собой право вносить изменения в Оферту. Изменения вступают в силу с момента публикации новой редакции на сайте.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">2. Предмет оферты</h2>
            <p>2.1. Исполнитель предоставляет Пользователю доступ к веб-приложению Lessonify — сервису для управления расписанием уроков, учёта оплат, назначения домашних заданий и Telegram-уведомлений (далее — «Сервис»).</p>
            <p className="mt-3">2.2. Сервис предоставляется на условиях «как есть» (as is). Исполнитель прилагает разумные усилия для обеспечения бесперебойной работы, но не гарантирует отсутствие ошибок и перебоев.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">3. Тарифы и оплата</h2>
            <p>3.1. Сервис предоставляется в двух тарифных планах:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong className="text-foreground">FREE</strong> — бесплатный, с ограничением до 5 учеников.</li>
              <li><strong className="text-foreground">PRO</strong> — 499 ₽/месяц или 3 990 ₽/год, без ограничений по количеству учеников и с доступом к расширенному функционалу.</li>
            </ul>
            <p className="mt-3">3.2. Оплата производится через платёжную систему Robokassa путём оплаты картой (Visa, Mastercard, Мир) или через Систему быстрых платежей (СБП).</p>
            <p className="mt-3">3.3. Подписка PRO активируется сразу после подтверждения оплаты и действует в течение оплаченного периода.</p>
            <p className="mt-3">3.4. Исполнитель вправе изменять стоимость тарифов, уведомив Пользователей не менее чем за 14 дней. Текущая оплаченная подписка продолжает действовать по прежней цене до окончания оплаченного периода.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">4. Возврат средств</h2>
            <p>4.1. Возврат возможен в течение 3 (трёх) календарных дней с момента оплаты путём обращения в поддержку по email: <a href="mailto:jukov0411200303@gmail.com" className="text-primary hover:underline">jukov0411200303@gmail.com</a>.</p>
            <p className="mt-3">4.2. По истечении 3 дней возврат средств не производится.</p>
            <p className="mt-3">4.3. Возврат осуществляется тем же способом, которым была произведена оплата, в срок до 10 рабочих дней.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">5. Права и обязанности сторон</h2>
            <p><strong className="text-foreground">Исполнитель обязуется:</strong></p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Обеспечивать работоспособность Сервиса.</li>
              <li>Обеспечивать сохранность данных Пользователя.</li>
              <li>Уведомлять о плановых технических работах.</li>
            </ul>
            <p className="mt-3"><strong className="text-foreground">Пользователь обязуется:</strong></p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Предоставлять достоверные данные при регистрации.</li>
              <li>Не использовать Сервис в противоправных целях.</li>
              <li>Не передавать данные учётной записи третьим лицам.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">6. Ограничение ответственности</h2>
            <p>6.1. Исполнитель не несёт ответственности за убытки, понесённые Пользователем вследствие использования или невозможности использования Сервиса.</p>
            <p className="mt-3">6.2. Максимальная совокупная ответственность Исполнителя ограничивается суммой, уплаченной Пользователем за последний оплаченный период.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">7. Срок действия и расторжение</h2>
            <p>7.1. Договор вступает в силу с момента акцепта Оферты и действует бессрочно.</p>
            <p className="mt-3">7.2. Пользователь вправе прекратить использование Сервиса и удалить свой аккаунт в любое время через настройки профиля или по запросу в поддержку.</p>
            <p className="mt-3">7.3. Исполнитель вправе заблокировать доступ Пользователя при нарушении условий Оферты.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">8. Реквизиты Исполнителя</h2>
            <p>Самозанятый Жуков Иван Андреевич</p>
            <p>ИНН: 434566912109</p>
            <p className="mt-1">Email: <a href="mailto:jukov0411200303@gmail.com" className="text-primary hover:underline">jukov0411200303@gmail.com</a></p>
            <p>Телефон: <a href="tel:+79254571210" className="text-primary hover:underline">+7 (925) 457-12-10</a></p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border mt-12">
        <div className="max-w-3xl mx-auto px-6 py-6 flex justify-between items-center text-sm text-muted-foreground">
          <p>© 2026 Lessonify</p>
          <Link href="/" className="hover:text-foreground transition-colors">На главную</Link>
        </div>
      </footer>
    </div>
  )
}
