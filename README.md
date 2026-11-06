# RETRO Store

متجر إلكترونيات وأجهزة ريترو باللغة العربية، مبني باستخدام Next.js 15 وSupabase.

## الحالة الحالية

هذه هي نقطة الانطلاق النظيفة للمشروع:
- واجهة رئيسية عربية RTL بهوية داكنة وألوان نيون.
- إعداد Next.js + TypeScript + Tailwind.
- إعداد Supabase SSR للمتصفح والخادم.
- مخطط أولي لقاعدة البيانات.
- إجراء SQL ذري لإنشاء الطلب والتحقق من الأسعار والمخزون.
- لا توجد بيانات اعتماد أو مفاتيح سرية مضمنة.

بعض الصفحات (السلة، البحث، تسجيل دخول المالك) هي هياكل أولية وليست وظائف مكتملة بعد.

## التشغيل محلياً

1. ثبّت Node.js 20 أو أحدث.
2. انسخ `.env.example` إلى `.env.local`.
3. أدخل `NEXT_PUBLIC_SUPABASE_URL` و`NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. ثبّت الحزم وشغّل المشروع:

```bash
npm install
npm run dev
```

## إعداد Supabase

1. أنشئ مشروعاً جديداً في Supabase.
2. افتح SQL Editor وشغّل `supabase/migrations/0001_initial_schema.sql`.
3. أنشئ مستخدم المالك من Supabase Auth.
4. عيّن دوره يدوياً من SQL Editor بعد الحصول على UUID للمستخدم:

```sql
update public.profiles set role = 'owner' where id = 'AUTH-USER-UUID';
```

ملاحظة: إنشاء صف profile للمستخدم يتم عبر trigger عند إنشاء مستخدم Auth. لا تفتح التسجيل العام للوحة الإدارة.

## متغيرات البيئة

- `NEXT_PUBLIC_SUPABASE_URL`: عنوان المشروع.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: المفتاح العام (anon/publishable).
- `SUPABASE_SERVICE_ROLE_KEY`: مفتاح خادم سري فقط، لا يستخدم في المتصفح ولا يضاف إلى Git.

## الأمان

- لا تضف `.env.local` إلى GitHub.
- لا تستخدم `SUPABASE_SERVICE_ROLE_KEY` في متغير يبدأ بـ `NEXT_PUBLIC_`.
- لا تفتح سياسات INSERT العامة على جدولي الطلبات وعناصر الطلبات؛ استخدم RPC `place_store_order`.
- يجب حماية كل عمليات الإدارة والتحقق من دور owner على الخادم، وليس middleware وحده.

## مراحل التنفيذ التالية

1. ربط بيانات المنتجات والفئات بقاعدة البيانات.
2. تنفيذ السلة وإتمام الطلب باستخدام RPC.
3. تنفيذ Supabase Auth وتقييد صفحات الإدارة للمالك.
4. لوحة إدارة المنتجات والطلبات والمخزون.
5. اختبار البناء والأمان ثم ربط GitHub وVercel.