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
        <h1 className="text-3xl font-bold mb-2 text-foreground">Публичная оферта о возмездном оказании услуг</h1>
        <p className="text-muted-foreground text-sm mb-10">Дата публикации: 5 июня 2026 г.</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">1. Общие положения</h2>
            <p>1.1. Настоящая публичная оферта (далее — «Оферта») является официальным предложением самозанятого Жукова Ивана Андреевича, ИНН 434566912109 (далее — «Исполнитель»), заключить договор возмездного оказания услуг на изложенных ниже условиях с любым дееспособным физическим лицом (далее — «Пользователь»).</p>
            <p className="mt-3">1.2. Оферта считается акцептованной, а договор — заключённым, с момента регистрации Пользователя в Сервисе и/или оплаты подписки.</p>
            <p className="mt-3">1.3. Исполнитель вправе вносить изменения в Оферту. Изменения вступают в силу с момента публикации новой редакции на сайте lessonify.ru. Уже оплаченный период оказывается на условиях, действовавших на момент оплаты.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">2. Описание услуги и её характеристики</h2>
            <p>2.1. «Lessonify» — онлайн-сервис (веб-приложение по адресу app.lessonify.ru и Telegram-бот @lessonify_bot) для организации работы репетитора (далее — «Сервис»).</p>
            <p className="mt-3">2.2. Функциональные характеристики и потребительские свойства Сервиса:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>расписание уроков по дням и месяцам, добавление урока за несколько секунд;</li>
              <li>учёт оплат и задолженностей, список должников;</li>
              <li>база учеников с историей занятий, заметками и статусами оплат;</li>
              <li>домашние задания с проверкой и статусами «задано / сдано / проверено»;</li>
              <li>финансовая аналитика: доход за период и его динамика;</li>
              <li>Telegram-напоминания ученикам об уроках и оплатах;</li>
              <li>голосовое добавление уроков и другие расширенные функции (в тарифе PRO);</li>
              <li>приглашение учеников по ссылке с доступом к расписанию и заданиям.</li>
            </ul>
            <p className="mt-3">2.3. Услуга носит нематериальный характер и оказывается дистанционно через сеть Интернет. Для использования необходимо устройство с доступом в Интернет и веб-браузером и/или мессенджером Telegram.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">3. Стоимость услуги</h2>
            <p>3.1. Сервис предоставляется в следующих тарифах:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong className="text-foreground">FREE</strong> — бесплатно, с ограничением до 5 учеников;</li>
              <li><strong className="text-foreground">PRO</strong> — <strong className="text-foreground">499 ₽ за 1 месяц</strong> или <strong className="text-foreground">3 990 ₽ за 1 год</strong>, без ограничения по количеству учеников и с доступом к расширенным функциям.</li>
            </ul>
            <p className="mt-3">3.2. Цены указаны в российских рублях и являются актуальными. Исполнитель применяет налог на профессиональный доход (самозанятый), НДС не облагается. На каждый платёж формируется чек.</p>
            <p className="mt-3">3.3. Исполнитель вправе изменять стоимость тарифов, уведомив Пользователей не менее чем за 14 дней. Ранее оплаченный период не пересчитывается и действует до его окончания.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">4. Порядок оформления заказа и сроки исполнения</h2>
            <p>4.1. Для оформления заказа Пользователь:</p>
            <ol className="list-decimal ml-6 mt-2 space-y-1">
              <li>регистрируется в Сервисе на app.lessonify.ru;</li>
              <li>выбирает тариф PRO и период оплаты (месяц или год);</li>
              <li>нажимает кнопку оплаты и совершает оплату через платёжный сервис Robokassa.</li>
            </ol>
            <p className="mt-3">4.2. Заказ считается оформленным с момента успешной оплаты.</p>
            <p className="mt-3">4.3. Срок исполнения: доступ к оплаченному тарифу активируется автоматически сразу после подтверждения оплаты платёжной системой (как правило, в течение нескольких минут) и предоставляется на весь оплаченный период.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">5. Условия и способы оплаты</h2>
            <p>5.1. Оплата производится онлайн через платёжный сервис Robokassa: банковскими картами Visa, Mastercard, «Мир», а также через Систему быстрых платежей (СБП).</p>
            <p className="mt-3">5.2. Все расчёты осуществляются в российских рублях. Моментом оплаты считается подтверждение платежа платёжной системой.</p>
            <p className="mt-3">5.3. После оплаты Исполнитель формирует чек самозанятого и при необходимости направляет его на email Пользователя.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">6. Порядок оказания услуг</h2>
            <p>6.1. Услуга оказывается дистанционно через сеть Интернет; материальная доставка товара не предусмотрена.</p>
            <p className="mt-3">6.2. Доступ к функциональности оплаченного тарифа предоставляется онлайн непосредственно после оплаты и действует непрерывно в течение оплаченного периода.</p>
            <p className="mt-3">6.3. Услуга считается оказанной надлежащим образом, если в течение оплаченного периода Пользователю был предоставлен доступ к Сервису.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">7. Отказ от услуги и возврат денежных средств</h2>
            <p>7.1. Пользователь вправе отказаться от услуги:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong className="text-foreground">до начала оказания услуги</strong> (до активации оплаченного тарифа) — с возвратом денежных средств <strong className="text-foreground">в полном объёме</strong>;</li>
              <li><strong className="text-foreground">в процессе оказания услуги</strong> (в течение оплаченного периода) — в любой момент; возврату подлежит стоимость неиспользованной части оплаченного периода, рассчитанная пропорционально количеству оставшихся дней.</li>
            </ul>
            <p className="mt-3">7.2. Пошаговый порядок возврата:</p>
            <ol className="list-decimal ml-6 mt-2 space-y-1">
              <li>Пользователь направляет заявление о возврате на email <a href="mailto:jukov0411200303@gmail.com" className="text-primary hover:underline">jukov0411200303@gmail.com</a>, указав ФИО, email аккаунта, дату и сумму платежа, причину возврата и, при необходимости, реквизиты для возврата.</li>
              <li>Исполнитель рассматривает заявление в течение 3 (трёх) рабочих дней и уведомляет Пользователя о принятом решении по email.</li>
              <li>При положительном решении денежные средства возвращаются тем же способом, которым была произведена оплата (на тот же счёт или карту), либо на счёт, указанный Пользователем в заявлении.</li>
            </ol>
            <p className="mt-3">7.3. Возврат денежных средств осуществляется в срок не более 10 (десяти) дней с момента получения заявления.</p>
            <p className="mt-3">7.4. Возврат производится в полном объёме подлежащей возврату суммы, <strong className="text-foreground">без удержания комиссий платёжных систем, банков или иных сборов</strong>.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">8. Права и обязанности сторон</h2>
            <p><strong className="text-foreground">Исполнитель обязуется:</strong></p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>обеспечивать работоспособность Сервиса;</li>
              <li>обеспечивать сохранность данных Пользователя;</li>
              <li>уведомлять о плановых технических работах.</li>
            </ul>
            <p className="mt-3"><strong className="text-foreground">Пользователь обязуется:</strong></p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>предоставлять достоверные данные при регистрации;</li>
              <li>не использовать Сервис в противоправных целях;</li>
              <li>не передавать данные учётной записи третьим лицам.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">9. Ограничение ответственности</h2>
            <p>9.1. Сервис предоставляется на условиях «как есть» (as is). Исполнитель прилагает разумные усилия для бесперебойной работы, но не гарантирует отсутствие ошибок и перебоев.</p>
            <p className="mt-3">9.2. Максимальная совокупная ответственность Исполнителя ограничивается суммой, уплаченной Пользователем за последний оплаченный период.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">10. Срок действия и расторжение</h2>
            <p>10.1. Договор вступает в силу с момента акцепта Оферты и действует бессрочно.</p>
            <p className="mt-3">10.2. Пользователь вправе прекратить использование Сервиса и удалить аккаунт в любое время через настройки профиля или по запросу в поддержку.</p>
            <p className="mt-3">10.3. Исполнитель вправе заблокировать доступ Пользователя при нарушении условий Оферты.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">11. Обработка персональных данных</h2>
            <p>11.1. Исполнитель обрабатывает персональные данные Пользователя в соответствии с Федеральным законом № 152-ФЗ «О персональных данных» и Политикой конфиденциальности, размещённой по адресу <Link href="/privacy" className="text-primary hover:underline">lessonify.ru/privacy</Link>.</p>
            <p className="mt-3">11.2. Акцептуя Оферту, Пользователь даёт согласие на обработку своих персональных данных на условиях указанной Политики.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">12. Реквизиты и контакты Исполнителя</h2>
            <p>Самозанятый Жуков Иван Андреевич</p>
            <p>ИНН: 434566912109</p>
            <p className="mt-1">Email: <a href="mailto:jukov0411200303@gmail.com" className="text-primary hover:underline">jukov0411200303@gmail.com</a></p>
            <p>Телефон: <a href="tel:+79254571210" className="text-primary hover:underline">+7 (925) 457-12-10</a></p>
            <p>Сайт: <a href="https://lessonify.ru" className="text-primary hover:underline">lessonify.ru</a></p>
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
