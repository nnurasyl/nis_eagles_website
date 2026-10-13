# Настройка писем регистрации для niseagles.study

Проверка 13 октября 2026: публичная сборка Vercel уже содержит настройки Supabase. В журналах Auth регистрация возвращает 500: `Dial tcp: address http://127.0.0.1:3000:465: too many colons in address`. Причина — вместо почтового сервера в SMTP Host указан адрес локального сайта.

1. Создай аккаунт на https://resend.com/.
2. В Resend открой Domains → Add Domain и укажи niseagles.study (без https:// и www).
3. В панели DNS твоего домена добавь записи, которые показывает Resend, с точными именами и значениями. Существующие записи сайта оставь на месте. Вернись в Resend и дождись статуса Verified. Одной регистрации аккаунта без подтверждения домена недостаточно.
4. В Resend → API Keys создай ключ с разрешением отправлять письма с этого домена.
5. В Supabase → Authentication → Emails → SMTP Settings введи:

   - Enable custom SMTP: включено
   - Sender email address: no-reply@niseagles.study
   - Sender name: NIS Eagles
   - Host: smtp.resend.com
   - Port number: 465
   - Username: resend
   - Password: API key из Resend, введи самостоятельно непосредственно в Supabase

   Нажми Save changes. Эти значения подходят для Resend; у другого провайдера будут свои параметры.
6. Уже настроено: Site URL = https://www.niseagles.study; Redirect URLs содержат https://www.niseagles.study и локальный http://127.0.0.1:3000. Проверку регистрации проводи на https://www.niseagles.study/.
7. Зарегистрируй свою настоящую школьную почту @hbalm.nis.edu.kz, используя пароль не короче 10 символов. Подтверди письмо, затем войди на сайт. При сбое проверь Supabase Logs → Auth и Resend Emails.

Школьный домен и подтверждение почты остаются включёнными. Повторно запускать schema.sql не нужно.

В lib/i18n.ts исправлены сообщения для сбоев отправки писем, создания аккаунта и ограничения числа попыток; изменения интерфейса попадут на Vercel после публикации обновлённого проекта. Само сохранение SMTP в Supabase не требует нового деплоя сайта.

Документация:
- https://resend.com/docs/send-with-smtp
- https://resend.com/docs/dashboard/domains/introduction
- https://supabase.com/docs/guides/auth/auth-smtp

## Соңғы тексеру

Resend-та niseagles.study домені Verified мәртебесіне өтті. Vercel-дегі DKIM TXT және rsend/send CNAME жазбалары талаптарға сәйкес, жария DNS арқылы да тексерілді. Доменді тексеру іске қосылып, сәтті аяқталды.

Supabase формасында сақталмаған өзгерістер бар. Username мәнін дәл resend деп енгізіп, Password өрісіне Resend API key қолданғаннан кейін пайдаланушы Save changes батырмасын өзі басуы керек. Толық тіркелуді және хаттың келуін нақты мектеп поштасымен тексеру әлі қажет.
