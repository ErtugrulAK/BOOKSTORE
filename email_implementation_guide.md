# Spring Boot Email Gönderme Implementasyon Rehberi

> **Kaynak Proje:** AI-Powered Recruitment System  
> **Stack:** Spring Boot 4.x · Java 17 · `spring-boot-starter-mail` · Gmail SMTP  
> **Yazar:** Analiz → Antigravity AI

---

## İçindekiler

1. [Genel Mimari](#1-genel-mimari)
2. [Bağımlılık Ekleme (pom.xml)](#2-bağımlılık-ekleme-pomxml)
3. [application.yml Mail Konfigürasyonu](#3-applicationyml-mail-konfigürasyonu)
4. [Gmail App Password Oluşturma](#4-gmail-app-password-oluşturma)
5. [EmailService Interface](#5-emailservice-interface)
6. [EmailServiceImpl](#6-emailserviceimpl)
7. [Async Mail Gönderimi (@EnableAsync)](#7-async-mail-gönderimi-enableasync)
8. [Mail'in Tetiklendiği Noktalar](#8-mailin-tetiklendiği-noktalar)
9. [Candidate Entity — Invite Token Alanları](#9-candidate-entity--invite-token-alanları)
10. [Tüm E-posta Akışları (Sequence Diyagramları)](#10-tüm-e-posta-akışları-sequence-diyagramları)
11. [Başka Bir Projede Adım Adım Uygulama](#11-başka-bir-projede-adım-adım-uygulama)
12. [Yaygın Hatalar ve Çözümleri](#12-yaygın-hatalar-ve-çözümleri)
13. [Genişletme: HTML Mail ve Thymeleaf](#13-genişletme-html-mail-ve-thymeleaf)

---

## 1. Genel Mimari

```
HTTP Request
    │
    ▼
Controller (HrController)
    │ çağırır
    ▼
CandidateInviteService / InterviewSlotService
    │ inject edilmiş
    ▼
EmailService  ← interface (soyutlama katmanı)
    │ implemente eder
    ▼
EmailServiceImpl
    │ kullanır
    ▼
JavaMailSender (Spring'in oto-konfigüre ettiği bean)
    │
    ▼
Gmail SMTP (smtp.gmail.com:587 / STARTTLS)
```

**Önemli Kararlar:**
- Mail gönderimi **interface + impl** pattern ile soyutlanmış → test edilebilir, değiştirilebilir.
- Her metot `@Async` ile işaretli → HTTP yanıtı mail gönderimini beklemeden döner.
- `SimpleMailMessage` kullanılmış (düz metin); HTML için `MimeMessage` gerekir.
- Hatalar `try/catch` ile yakalanıp loglanır; exception fırlatılmaz → bir mailin başarısız olması tüm işlemi patlatmaz.

---

## 2. Bağımlılık Ekleme (pom.xml)

```xml
<!-- pom.xml içine <dependencies> bloğuna ekle -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

> Bu bağımlılık `JavaMailSender` bean'ini otomatik olarak context'e kayıt eder.  
> Ayrı bir `@Configuration` sınıfı yazman gerekmez.

---

## 3. application.yml Mail Konfigürasyonu

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${MAIL_USERNAME:senin@gmail.com}   # env var veya fallback
    password: ${MAIL_PASSWORD:xxxx xxxx xxxx xxxx}  # Gmail App Password
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true

# Kendi app'ine özgü — frontend link'leri için
app:
  frontend:
    url: ${FRONTEND_URL:http://localhost:3000}
```

**Neden bu ayarlar?**

| Ayar | Açıklama |
|------|-----------|
| `host: smtp.gmail.com` | Gmail'in giden posta sunucusu |
| `port: 587` | STARTTLS portu (SSL için 465 kullanılır) |
| `mail.smtp.auth: true` | Kimlik doğrulama zorunlu |
| `mail.smtp.starttls.enable: true` | Bağlantıyı şifreli kanala yükseltir |

---

## 4. Gmail App Password Oluşturma

> [!IMPORTANT]
> Gmail hesabınızda 2 Faktörlü Doğrulama (2FA) **açık** olmalıdır. Normal Gmail şifreniz SMTP ile çalışmaz.

**Adımlar:**
1. `myaccount.google.com` → **Security** → **2-Step Verification**'ı aç
2. Aynı sayfada aşağı kaydır → **App passwords** bölümüne gir
3. "Select app" → **Mail**, "Select device" → **Other (Custom name)** → `MyApp` yaz
4. **Generate** tıkla → `xxxx xxxx xxxx xxxx` formatında 16 karakterlik şifreyi kopyala
5. Bu değeri `MAIL_PASSWORD` environment variable olarak ya da `application.yml`'a yaz

---

## 5. EmailService Interface

```java
package com.yourcompany.yourapp.service;

/**
 * Mail gönderme sözleşmesi.
 * Implementasyon değişse bile (Gmail → SendGrid gibi) çağıran kod değişmez.
 */
public interface EmailService {

    /** Platforma yeni eklenen kullanıcıya davet linki gönderir. */
    void sendInviteEmail(String to, String inviteToken, String jobTitle);

    /** Var olan kullanıcıya iş pozisyonu atamasını bildirir. */
    void sendJobAssignmentEmail(String to, String jobTitle);

    /** Mülakat saatleri açıldığında adayları bilgilendirir. */
    void sendInterviewSlotsAvailableEmail(String to, String jobTitle, String applicationsUrl);
}
```

---

## 6. EmailServiceImpl

```java
package com.yourcompany.yourapp.service.impl;

import com.yourcompany.yourapp.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    // Spring, application.yml'daki mail konfigürasyonunu okuyarak bu bean'i otomatik inject eder
    private final JavaMailSender mailSender;

    // Gönderen adres — application.yml'daki spring.mail.username değerini okur
    @Value("${spring.mail.username}")
    private String fromEmail;

    // Frontend URL — linkleri oluştururken kullanılır
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    /**
     * @Async → metot ayrı bir thread'de çalışır.
     * HTTP yanıtı, mail gönderilmesini beklemeden hemen döner.
     */
    @Async
    @Override
    public void sendInviteEmail(String to, String inviteToken, String jobTitle) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("You have been invited to apply for a role");

            String roleText = jobTitle != null ? " for the " + jobTitle + " position" : "";
            // Token, URL parametresi olarak gömülür → aday bu linke tıklayarak hesabını aktive eder
            String claimUrl = frontendUrl + "/invite/claim?token=" + inviteToken;

            message.setText(
                "Hello,\n\n" +
                "You have been invited to our recruitment platform" + roleText + ".\n" +
                "To access your account and continue your application, please click the link below:\n\n" +
                claimUrl + "\n\n" +
                "This link will expire in 7 days.\n\n" +
                "Best regards,\nthe Recruitment Team"
            );

            mailSender.send(message);
            log.info("Sent invite email to {}", to);
        } catch (Exception e) {
            // Exception fırlatılmaz → bir mailin başarısız olması işlemi durdurmaz
            log.error("Failed to send invite email to {}", to, e);
        }
    }

    @Async
    @Override
    public void sendJobAssignmentEmail(String to, String jobTitle) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("You have been assigned to a new role");

            String loginUrl = frontendUrl + "/login";

            message.setText(
                "Hello,\n\n" +
                "You have been assigned to the " + jobTitle + " position on our recruitment platform.\n" +
                "Please log in to your account to review the position details:\n\n" +
                loginUrl + "\n\n" +
                "Best regards,\nthe Recruitment Team"
            );

            mailSender.send(message);
            log.info("Sent job assignment email to {}", to);
        } catch (Exception e) {
            log.error("Failed to send job assignment email to {}", to, e);
        }
    }

    @Async
    @Override
    public void sendInterviewSlotsAvailableEmail(String to, String jobTitle, String applicationsUrl) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("Interview time slots are now open — " + jobTitle);
            message.setText(
                "Hello,\n\n" +
                "New interview time slots have been published for the \"" + jobTitle + "\" position.\n" +
                "Log in and book a time on your application page (first come, first served):\n\n" +
                applicationsUrl + "\n\n" +
                "Best regards,\nthe Recruitment Team"
            );

            mailSender.send(message);
            log.info("Sent interview slots notification to {}", to);
        } catch (Exception e) {
            log.error("Failed to send interview slots email to {}", to, e);
        }
    }
}
```

---

## 7. Async Mail Gönderimi (@EnableAsync)

**Spring'e async desteğini açmak için main sınıfına `@EnableAsync` ekle:**

```java
package com.yourcompany.yourapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync   // ← Bu annotation olmadan @Async etkisiz kalır!
public class YourApplication {
    public static void main(String[] args) {
        SpringApplication.run(YourApplication.class, args);
    }
}
```

> [!WARNING]
> `@EnableAsync` olmadan `@Async` annotasyonlu metotlar **senkron** çalışır ve HTTP isteği mail gönderilene kadar bloke olur. Bu, timeout ve kötü kullanıcı deneyimine yol açar.

**Özel thread pool (opsiyonel ama önerilen):**

```java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("mail-");
        executor.initialize();
        return executor;
    }
}
```

---

## 8. Mail'in Tetiklendiği Noktalar

Projedeki **3 farklı senaryo** ve hangi metotların çağrıldığı:

### 8.1 — Yeni Aday Daveti (`sendInviteEmail`)

```
HR → POST /api/v1/hr/candidates/invite
    └─ HrController.inviteCandidate()
        └─ CandidateInviteService.inviteSingleCandidate()
            └─ processSingleInvite()
                ├─ Yeni ghost candidate oluştur (isActivated=false, token üret)
                └─ emailService.sendInviteEmail(email, token, null)
```

**Token üretim kodu:**
```java
Candidate ghost = Candidate.builder()
    .email(request.getEmail())
    .isActivated(false)
    .inviteToken(UUID.randomUUID().toString())   // güvenli random token
    .inviteTokenExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
    .addedByHr(true)
    .build();
```

### 8.2 — İş Pozisyonu Atama (`sendJobAssignmentEmail` veya `sendInviteEmail`)

```
HR → POST /api/v1/hr/jobs/{jobId}/candidates/assign?email=...
    └─ CandidateInviteService.assignCandidateToJob()
        └─ processSingleAssignment()
            ├─ Aday aktif mi?
            │   ├─ EVET → sendJobAssignmentEmail(email, jobTitle)
            │   └─ HAYIR → sendInviteEmail(email, token, jobTitle)  ← job title'ı da gönderir
            └─ Application kaydı oluştur
```

### 8.3 — Mülakat Saatleri Açıldığında (`sendInterviewSlotsAvailableEmail`)

```
HR → POST /api/v1/hr/jobs/{jobId}/interview-window
    └─ InterviewSlotService.openWindow()
        ├─ Slotları oluştur
        └─ INTERVIEWING statüsündeki tüm adaylara döngüyle mail gönder:
            for (Application app : interviewing) {
                emailService.sendInterviewSlotsAvailableEmail(email, jobTitle, applicationsPage);
            }
```

---

## 9. Candidate Entity — Invite Token Alanları

```java
@Entity
@Table(name = "candidates")
public class Candidate {

    @Column(unique = true)
    private String email;           // Adayın mail adresi

    @Builder.Default
    private Boolean isActivated = false;  // Hesap aktive edildi mi?

    private String inviteToken;           // UUID tabanlı güvenli token
    private Instant inviteTokenExpiresAt; // 7 günlük expiry

    @Builder.Default
    private Boolean addedByHr = false;    // HR tarafından mı eklendi?

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    private User user;  // null → ghost candidate, dolu → aktive edilmiş aday
}
```

**"Ghost Candidate" Konsepti:**
- HR, var olmayan bir e-posta adresini sisteme ekler → `Candidate` kaydı oluşur ama `User` kaydı yoktur.
- Aday mail'deki linke tıklar → `/invite/claim?token=TOKEN` endpoint'i çalışır.
- `InviteClaimService.claimAccount()` token doğrular, şifre alır, `User` kaydı oluşturur → `isActivated = true` yapılır.

---

## 10. Tüm E-posta Akışları (Sequence Diyagramları)

### Akış 1: Davet → Hesap Aktifleştirme

```
HR              Backend             Gmail            Aday
 │                  │                  │              │
 │──POST /invite──▶ │                  │              │
 │                  │──ghost oluştur──▶│              │
 │                  │──sendInviteEmail─▶ SMTP ────────▶│
 │◀──200 OK──────── │                  │              │
 │                  │                  │   ──tıklar──▶│
 │                  │◀──POST /claim?token=...──────────│
 │                  │──User kaydı oluştur              │
 │                  │──isActivated=true                │
 │                  │──JWT token üret                  │
 │                  │──────────────────────────────────▶│
```

### Akış 2: Mülakat Saatleri Bildirimi

```
HR              Backend             Gmail          Aday(lar)
 │                  │                  │              │
 │──POST /window──▶ │                  │              │
 │                  │──Slotları oluştur│              │
 │                  │──INTERVIEWING    │              │
 │                  │  adayları bul    │              │
 │                  │──for each aday──▶ SMTP ────────▶│ (async)
 │◀──201 Created─── │                  │              │
```

---

## 11. Başka Bir Projede Adım Adım Uygulama

### Adım 1: Bağımlılığı Ekle

`pom.xml`'e ekle:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

### Adım 2: application.yml'ı Yapılandır

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${MAIL_USERNAME}
    password: ${MAIL_PASSWORD}
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true

app:
  frontend:
    url: ${FRONTEND_URL:http://localhost:3000}
```

### Adım 3: Gmail App Password Al

[Bölüm 4](#4-gmail-app-password-oluşturma)'teki adımları izle.

### Adım 4: Interface Tanımla

```java
// src/main/java/com/yourapp/service/EmailService.java
public interface EmailService {
    void sendWelcomeEmail(String to, String name);
    void sendPasswordResetEmail(String to, String resetToken);
    // kendi ihtiyacına göre metotlar ekle
}
```

### Adım 5: Implementation Yaz

```java
// src/main/java/com/yourapp/service/impl/EmailServiceImpl.java
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Async
    @Override
    public void sendWelcomeEmail(String to, String name) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromEmail);
            msg.setTo(to);
            msg.setSubject("Welcome to Our Platform!");
            msg.setText("Hello " + name + ",\n\nWelcome aboard!\n\nTeam");
            mailSender.send(msg);
            log.info("Welcome email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send welcome email to {}", to, e);
        }
    }

    @Async
    @Override
    public void sendPasswordResetEmail(String to, String resetToken) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromEmail);
            msg.setTo(to);
            msg.setSubject("Password Reset Request");
            msg.setText("Click to reset: " + frontendUrl + "/reset-password?token=" + resetToken);
            mailSender.send(msg);
            log.info("Password reset email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send reset email to {}", to, e);
        }
    }
}
```

### Adım 6: @EnableAsync Ekle

```java
@SpringBootApplication
@EnableAsync
public class YourApplication {
    public static void main(String[] args) {
        SpringApplication.run(YourApplication.class, args);
    }
}
```

### Adım 7: Service'lere Inject Et

```java
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final EmailService emailService;  // inject et

    @Transactional
    public User register(RegisterRequest request) {
        User user = userRepository.save(/* ... */);
        emailService.sendWelcomeEmail(user.getEmail(), user.getName()); // çağır
        return user;
    }
}
```

### Adım 8: .env / Environment Variables Ayarla

`.env` dosyası (ya da IDE/Docker run config):
```
MAIL_USERNAME=youremail@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx
FRONTEND_URL=https://yourapp.com
```

---

## 12. Yaygın Hatalar ve Çözümleri

| Hata | Neden | Çözüm |
|------|-------|-------|
| `AuthenticationFailedException` | Yanlış şifre veya normal Gmail şifresi kullanıldı | App Password oluştur (Bölüm 4) |
| `MailSendException: 535-5.7.8` | Gmail hesabında 2FA açık değil | 2FA'yı aç, sonra App Password al |
| Mail gönderiliyor ama gelmeyis | Spam klasörüne düşüyor | SPF/DKIM/DMARC ayarla, ya da test için Mailtrap kullan |
| `@Async` çalışmıyor | `@EnableAsync` eksik | Main sınıfa `@EnableAsync` ekle |
| `NoSuchBeanDefinitionException: JavaMailSender` | Dependency eksik | `spring-boot-starter-mail` bağımlılığını ekle |
| SSL handshake hatası | Port/STARTTLS uyumsuzluğu | Port 587 + `starttls.enable: true` kullan; SSL için 465 + `ssl.enable: true` |
| Mail gönderimi HTTP yanıtını yavaşlatıyor | `@Async` ve `@EnableAsync` eksik | Her iki annotation'ı da ekle |

---

## 13. Genişletme: HTML Mail ve Thymeleaf

Projede `SimpleMailMessage` (düz metin) kullanılıyor. HTML mail için:

### 13.1 Bağımlılık Ekle

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
<dependency>
    <groupId>org.thymeleaf.extras</groupId>
    <artifactId>thymeleaf-extras-springsecurity6</artifactId>
</dependency>
```

### 13.2 HTML Şablon (src/main/resources/templates/invite-email.html)

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<body>
  <h2>Hello!</h2>
  <p>You have been invited to apply for <strong th:text="${jobTitle}">a position</strong>.</p>
  <a th:href="${claimUrl}">Click here to activate your account</a>
  <p>This link expires in 7 days.</p>
</body>
</html>
```

### 13.3 MimeMessage ile Gönderim

```java
import org.springframework.mail.javamail.MimeMessageHelper;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Async
public void sendHtmlInviteEmail(String to, String inviteToken, String jobTitle) {
    try {
        Context ctx = new Context();
        ctx.setVariable("jobTitle", jobTitle);
        ctx.setVariable("claimUrl", frontendUrl + "/invite/claim?token=" + inviteToken);

        String htmlContent = templateEngine.process("invite-email", ctx);

        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject("You have been invited!");
        helper.setText(htmlContent, true); // true = HTML

        mailSender.send(mimeMessage);
    } catch (Exception e) {
        log.error("Failed to send HTML invite email to {}", to, e);
    }
}
```

---

## Özet Kontrol Listesi

- [ ] `spring-boot-starter-mail` bağımlılığı eklendi
- [ ] `application.yml`'a `spring.mail.*` ayarları girildi
- [ ] Gmail App Password oluşturuldu ve env variable olarak set edildi
- [ ] `EmailService` interface tanımlandı
- [ ] `EmailServiceImpl` yazıldı (`@Slf4j`, `@Service`, `@RequiredArgsConstructor`)
- [ ] Her mail metodu `@Async` ile işaretlendi
- [ ] Main sınıfa `@EnableAsync` eklendi
- [ ] `emailService` gerekli service'lere inject edildi
- [ ] Mail gönderimi try/catch ile sarıldı, exception fırlatılmıyor
- [ ] `frontendUrl` gibi sabit değerler `@Value` ile yml'den okunuyor
- [ ] Test için Mailtrap veya gerçek Gmail hesabı ile doğrulandı
