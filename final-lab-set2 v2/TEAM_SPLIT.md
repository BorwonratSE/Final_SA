# TEAM_SPLIT.md - Group [11]

## สมาชิกในกลุ่ม
1. [67543210036-9] [นายบวรรัตน์  ศิริเมือง] (Member 1)
2. [67543210043-5] [นายภาณุวัฒน์  ยาท้วม] (Member 2)

## การแบ่งงาน (Responsibility Matrix)

### [นายบวรรัตน์  ศิริเมือง] - Service Development & Backend
- **Microservices Development:** พัฒนาส่วน Logic การทำงานของ Auth Service, Task Service และ Log Service
- **Environment Management:** จัดการไฟล์ `.env` สำหรับกำหนดค่าตัวแปรระบบ (Environment Variables) และรหัสผ่านฐานข้อมูล
- **Database Initialization:** ออกแบบและจัดเตรียมไฟล์ `init.sql` เพื่อสร้าง Table และจัดการ Seed Users (Alice, Bob, Admin) ให้ระบบพร้อมใช้งาน
- **Frontend Logic Integration:** เชื่อมต่อการทำงานของหน้าเว็บ (JavaScript) ให้รับส่งข้อมูลผ่าน API Gateway ได้อย่างถูกต้อง

### [นายภาณุวัฒน์  ยาท้วม] - Infrastructure & Security Setup
- **Nginx API Gateway Configuration:** ออกแบบและตั้งค่า Reverse Proxy เพื่อเป็นประตูทางเข้าหลัก (Entry Point) ของระบบ และจัดการ Routing ไปยัง Microservices ต่างๆ (Auth, Task, Log)
- **HTTPS & SSL Setup:** ดำเนินการสร้าง Self-signed Certificate ผ่าน OpenSSL ใน Docker และตั้งค่าการสื่อสารแบบเข้ารหัสบน Nginx
- **Security Hardening:** บล็อกเส้นทาง Internal API (เช่น `/api/logs/internal`) เพื่อป้องกันการเข้าถึงจากภายนอกตามข้อกำหนดของระบบ
- **System Integration & QA:** ควบคุมการรันระบบทั้งหมดด้วย Docker Compose, แก้ไขปัญหาการแสดงผล CSS (HTTPS Mixed Content), และดำเนินการทดสอบระบบเพื่อจัดทำ Screenshots หลักฐานทั้ง 12 ชุด

---