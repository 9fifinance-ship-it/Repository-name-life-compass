# Life Compass

Ladipage một trang deploy lên Vercel, kèm serverless API để nhận vấn đề của người dùng trong các nhóm phong thủy, đầu tư, sức khỏe, tâm lý; sau đó lưu lead vào Supabase, tạo invite đăng nhập và gửi email qua Resend.

## Luồng chính

1. Người dùng điền email, nhóm vấn đề và bối cảnh cần gỡ rối.
2. `/api/lead` validate dữ liệu và chống bot bằng honeypot.
3. Supabase REST lưu hoặc cập nhật hồ sơ trong `waitlist_leads`.
4. Supabase Auth gửi invite/magic access cho email đó.
5. Resend gửi email xác nhận cho người dùng và thông báo lead mới cho owner.

Trang này chỉ dùng để phân loại và định hướng bước đầu, không thay thế tư vấn y tế, tài chính hoặc tâm lý chuyên môn.

## API keys cần lấy

Tạo các biến này trong Vercel Project Settings > Environment Variables:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_ANON_KEY=your-supabase-anon-key
RESEND_API_KEY=re_your_resend_key
RESEND_FROM=Life Compass <hello@yourdomain.com>
OWNER_NOTIFY_EMAIL=your-inbox@example.com
PUBLIC_SITE_URL=https://your-domain.vercel.app
```

`SUPABASE_SERVICE_ROLE_KEY` chỉ nằm ở serverless function, không đưa vào frontend.

## Setup Supabase

Chạy nội dung trong `supabase.sql` ở Supabase SQL Editor để tạo bảng lead và policy cho service role.

## Deploy Vercel

Repo này không cần build step. Vercel sẽ serve `index.html`, `styles.css`, `app.js`, asset trong `public/`, và chạy `api/lead.js` như serverless function.

```bash
vercel
vercel --prod
```

Nếu muốn chạy local bằng Vercel CLI:

```bash
vercel dev
```
