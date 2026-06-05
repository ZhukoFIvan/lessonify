import Link from 'next/link'

export const metadata = {
  title: 'Политика конфиденциальности — Lessonify',
}

export default function PrivacyPage() {
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
          <span className="text-muted-foreground text-sm">Политика конфиденциальности</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Политика конфиденциальности</h1>
        <p className="text-muted-foreground text-sm mb-10">Дата публикации: 5 июня 2026 г.</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">1. Общие положения</h2>
            <p>1.1. Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок обработки и защиты персональных данных пользователей сервиса Lessonify (далее — «Сервис»).</p>
            <p className="mt-3">1.2. Оператором персональных данных является самозанятый Жуков Иван Андреевич, ИНН 434566912109 (далее — «Оператор»).</p>
            <p className="mt-3">1.3. Используя Сервис, Пользователь выражает согласие с условиями настоящей Политики. Если Пользователь не согласен с Политикой, он должен прекратить использование Сервиса.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">2. Какие данные мы собираем</h2>
            <p>2.1. При регистрации и использовании Сервиса мы можем собирать следующие данные:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Имя и фамилия</li>
              <li>Адрес электронной почты</li>
              <li>Номер телефона (при привязке Telegram)</li>
              <li>Telegram ID (при подключении уведомлений)</li>
              <li>Данные об учениках, которые репетитор вносит в Сервис (имя, предмет, контакт)</li>
              <li>Информация об уроках и расписании</li>
              <li>Данные об оплатах (факт оплаты, суммы — без данных банковских карт)</li>
              <li>Техническая информация: IP-адрес, тип браузера, устройство</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">3. Цели обработки данных</h2>
            <p>3.1. Персональные данные обрабатываются для:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Предоставления доступа к функциям Сервиса</li>
              <li>Идентификации и аутентификации Пользователя</li>
              <li>Отправки уведомлений (email, Telegram, Web Push)</li>
              <li>Обработки платежей и управления подпиской</li>
              <li>Улучшения качества Сервиса</li>
              <li>Связи с Пользователем по вопросам поддержки</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">4. Хранение и защита данных</h2>
            <p>4.1. Данные хранятся на защищённых серверах. Мы применяем стандартные меры безопасности: шифрование паролей, HTTPS, ограничение доступа.</p>
            <p className="mt-3">4.2. Данные банковских карт не хранятся на серверах Сервиса. Обработка платежей осуществляется через платёжную систему Robokassa, сертифицированную по стандарту PCI DSS.</p>
            <p className="mt-3">4.3. Данные хранятся в течение всего периода использования Сервиса. После удаления аккаунта данные удаляются в течение 30 календарных дней.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">5. Передача данных третьим лицам</h2>
            <p>5.1. Мы не продаём и не передаём персональные данные третьим лицам, за исключением случаев:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Обработка платежей — данные передаются в Robokassa для проведения транзакций.</li>
              <li>Telegram — Telegram ID передаётся для доставки уведомлений через бота.</li>
              <li>Требования законодательства — при запросе уполномоченных государственных органов.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">6. Cookies и аналитика</h2>
            <p>6.1. Сервис использует cookies для поддержания сессии авторизации и хранения пользовательских настроек.</p>
            <p className="mt-3">6.2. Мы можем использовать анонимную аналитику для улучшения работы Сервиса. Аналитические данные не содержат персональных данных.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">7. Права Пользователя</h2>
            <p>7.1. Пользователь имеет право:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Запросить информацию о хранимых персональных данных.</li>
              <li>Потребовать исправления неточных данных.</li>
              <li>Потребовать удаления своих данных (удаление аккаунта).</li>
              <li>Отозвать согласие на обработку персональных данных.</li>
            </ul>
            <p className="mt-3">7.2. Для реализации своих прав Пользователь может обратиться по email: <a href="mailto:jukov0411200303@gmail.com" className="text-primary hover:underline">jukov0411200303@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">8. Изменения Политики</h2>
            <p>8.1. Оператор вправе вносить изменения в настоящую Политику. Новая редакция вступает в силу с момента публикации на сайте.</p>
            <p className="mt-3">8.2. Продолжение использования Сервиса после изменения Политики означает согласие с новой редакцией.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">9. Контакты</h2>
            <p>Самозанятый Жуков Иван Андреевич</p>
            <p>ИНН: 434566912109</p>
            <p className="mt-1">Email: <a href="mailto:jukov0411200303@gmail.com" className="text-primary hover:underline">jukov0411200303@gmail.com</a></p>
            <p>Телефон: <a href="tel:+79254571210" className="text-primary hover:underline">+7 (925) 457-12-10</a></p>
            <p className="mt-1">Сайт: <a href="https://lessonify.ru" className="text-primary hover:underline">lessonify.ru</a></p>
            <p>Приложение: <a href="https://app.lessonify.ru" className="text-primary hover:underline">app.lessonify.ru</a></p>
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
