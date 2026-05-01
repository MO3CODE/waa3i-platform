# منصة وعي — Waa3i Platform

> **بما لا يسع المسلم جهله**  
> منصة تعليمية إسلامية مجانية للشباب المسلم

---

## عن المشروع

**وعي** منصة تعليمية مجانية تقدم مسارًا دراسيًا منظمًا في العلوم الإسلامية الأساسية، مع تتبع تقدم الطالب وشهادات إتمام.

### المواد الدراسية
- الإيمان · التفسير · السنة النبوية · الفقه · التزكية · الثقافة الإسلامية

---

## التقنيات

| الطبقة | التقنية |
|--------|---------|
| Frontend | React 18, React Router v6 |
| قاعدة البيانات | Firebase Firestore |
| المصادقة | Firebase Authentication |
| الفيديو | YouTube IFrame API |
| النشر | Netlify / Vercel |

---

## المتطلبات

- Node.js 18+
- npm 9+
- مشروع Firebase (Firestore + Authentication)

---

## تشغيل المشروع

```bash
# تثبيت المكتبات
npm install

# تشغيل محلي
npm start

# بناء للإنتاج
npm run build
```

---

## إعداد Firebase

1. أنشئ مشروعًا في [Firebase Console](https://console.firebase.google.com)
2. فعّل **Authentication** (Email/Password)
3. فعّل **Firestore Database**
4. انسخ إعدادات المشروع إلى `src/data/db.js`

```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
};
```

---

## هيكل المشروع

```
src/
├── pages/
│   ├── Landing/          # الصفحة الرئيسية العامة
│   ├── Auth/             # تسجيل الدخول / إنشاء حساب
│   ├── Student/          # لوحة الطالب
│   ├── CourseView/       # مشغل المادة + الملاحظات + الاختبار
│   └── Admin/            # لوحة الإدارة (الجوكر)
│       └── tabs/         # تبويبات المواد والأدوار والاختبارات...
├── components/
│   ├── layout/           # Sidebar
│   └── ui/               # مكونات قابلة لإعادة الاستخدام
├── data/
│   ├── db.js             # كل استدعاءات Firebase
│   └── courses.js        # بيانات المواد الأولية (للـ seed)
├── hooks/                # useYouTubePlayer, useToast
├── utils/                # helpers
└── styles/               # CSS Variables + RTL
```

---

## نظام الأدوار

| الدور | الوصف |
|-------|-------|
| `superadmin` | جوكر — صلاحية كاملة |
| `content_manager` | يدير المواد والمحاضرات |
| `instructor_admin` | يدير اختباراته ولقاءاته |
| `student_admin` | يشرف على الطلاب والشهادات |
| `student` | يتابع المسار التعليمي |

---

## النشر

### Netlify
```bash
npm run build
# ارفع مجلد build/ أو اربط الـ repository
```

### Vercel
اربط الـ repository مباشرة — الإعداد موجود في `vercel.json`

---

## الترخيص

هذا المشروع لأغراض تعليمية وغير تجارية.
