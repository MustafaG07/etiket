import { describe, expect, it } from "vitest";
import { applyOverrides, parseAdDescription, splitMultipleAds } from "../index";
import aciklamalarMd from "../../../aciklamalar.md?raw";

describe("Kongoru İlan Ayrıştırıcı (Parser) — Kapsamlı Test Paketi", () => {
  it("01. MSI Cyborg 15 gerçek Kongoru ilan formatını doğru ayrıştırır", () => {
    const raw = `MSI CYBORG 15 A13VF | i7-13620H | RTX 4060 8GB | 16 GB DDR5 | 512 GB NVMe | 15.6" 144Hz
• Intel Core i7-13620H İşlemci
• NVIDIA GeForce RTX 4060 8GB GDDR6 Ekran Kartı
• 16 GB DDR5 5200MHz RAM
• 512 GB PCIe Gen4 NVMe SSD
• 15.6 inç FHD IPS 144Hz Ekran
• Pil Sağlığı %96 • 4-5 Saat Kullanım
• 14 Ay Resmi Distribütör Garantili
• Orijinal Kutu + Fatura + Orijinal Şarj Aleti
KONGORU • Serdivan / Sakarya
STOK KODU: L-1008`;

    const res = parseAdDescription(raw);
    expect(res.title).toBe("MSI CYBORG 15 A13VF");
    expect(res.subtitle).toBe("GAMING LAPTOP");
    expect(res.stockCode).toBe("L-1008");
    expect(res.specs.find((s) => s.icon === "cpu")?.v).toBe("Intel Core i7-13620H");
    expect(res.specs.find((s) => s.icon === "gpu")?.v).toContain("RTX 4060 · 8 GB GDDR6");
    expect(res.specs.find((s) => s.icon === "ram")?.v).toBe("16 GB 5200 MHz DDR5");
    expect(res.specs.find((s) => s.icon === "ssd")?.v).toContain("512 GB PCIe Gen4 NVMe SSD");
    expect(res.specs.find((s) => s.icon === "screen")?.v).toContain("15.6 inç FHD IPS 144 Hz");
    expect(res.specs.find((s) => s.icon === "battery")?.v).toContain("Sağlık %96");
    expect(res.warrantyDuration).toContain("14 Ay");
    expect(res.boxLine1).toBe("Orijinal Kutu · Fatura");
  });

  it("02. ASUS ROG Flow X16 2-in-1 dokunmatik laptop formatını doğru ayrıştırır", () => {
    const raw = `ASUS ROG FLOW X16 GV601 | RYZEN 9 6900HS | RTX 3060 6GB | 16GB DDR5 | 1TB SSD | 16" QHD+ 165Hz Dokunmatik
• AMD Ryzen 9 6900HS
• RTX 3060 6GB 125W
• 16 GB DDR5 4800MHz
• 1 TB NVMe M.2 SSD
• 16 inç QHD+ IPS 165Hz Dokunmatik %100 sRGB
• Pil Sağlığı %91 (3-4 Saat)
Stok Kodu: L-966`;

    const res = parseAdDescription(raw);
    expect(res.stockCode).toBe("L-966");
    expect(res.subtitle).toBe("GAMING LAPTOP");
    expect(res.specs.find((s) => s.icon === "cpu")?.v).toBe("AMD Ryzen 9 6900HS");
    expect(res.specs.find((s) => s.icon === "gpu")?.v).toContain("RTX 3060 · 6 GB · 125W");
    expect(res.specs.find((s) => s.icon === "ram")?.v).toBe("16 GB 4800 MHz DDR5");
    expect(res.specs.find((s) => s.icon === "ssd")?.v).toContain("1 TB NVMe M.2 SSD");
    expect(res.specs.find((s) => s.icon === "screen")?.v).toContain("Dokunmatik");
    expect(res.specs.find((s) => s.icon === "battery")?.v).toContain("%91");
  });

  it("03. Lenovo LOQ + gürültülü pazarlama metinlerini temizleyip ayrıştırır", () => {
    const raw = `LENOVO LOQ 15IRH8 | i7-13620H | RTX 4060 | 16 GB DDR5 | 512 GB SSD | 15.6" FHD 144Hz
Cihaz tertemiz olup hiçbir sorunu yoktur.
Termal macun bakımları yeni yapılmıştır.
Fiyat: 42.500 TL
Tel: 0532 111 22 33
Kredi kartına 12 taksit imkanı vardır. Alıcısına hayırlı olsun.`;

    const res = parseAdDescription(raw);
    expect(res.title).toBe("LENOVO LOQ 15IRH8");
    expect(res.specs.find((s) => s.icon === "cpu")?.v).toBe("Intel Core i7-13620H");
    expect(res.specs.find((s) => s.icon === "gpu")?.v).toBe("RTX 4060");
    expect(res.specs.find((s) => s.icon === "ram")?.v).toBe("16 GB DDR5");
    expect(res.specs.find((s) => s.icon === "ssd")?.v).toBe("512 GB SSD");
    const extras = res.specs.find((s) => s.icon === "extras")?.v || "";
    expect(extras).not.toMatch(/taksit|42\.500|0532|macun/i);
  });

  it("04. Apple MacBook Pro M3 Pro 18GB bellek ve pil devrini doğru ayrıştırır", () => {
    const raw = `APPLE MACBOOK PRO 14 M3 PRO
• Apple M3 Pro (11 Çekirdek CPU)
• 18 GB Unified Memory Bellek
• 512 GB NVMe SSD
• 14.2 inç Liquid Retina XDR 120Hz Ekran
• Pil Sağlığı %98 - Devir Sayısı: 24
• Kutu ve Fatura Mevcut
• Türkiye Garantili`;

    const res = parseAdDescription(raw);
    expect(res.subtitle).toBe("APPLE MACBOOK PRO");
    expect(res.specs.find((s) => s.icon === "cpu")?.v).toContain("Apple M3 Pro");
    expect(res.specs.find((s) => s.icon === "ram")?.v).toBe("18 GB");
    expect(res.specs.find((s) => s.icon === "ssd")?.v).toContain("512 GB");
    expect(res.specs.find((s) => s.icon === "screen")?.v).toContain("14.2 inç Liquid Retina XDR 120 Hz");
    expect(res.specs.find((s) => s.icon === "battery")?.v).toContain("Sağlık %98 · 24 Devir");
    expect(res.specs.find((s) => s.icon === "gpu")?.v).toContain("Apple M3 Pro");
  });

  it("05. Apple MacBook Air M2 kısa 8/256 yazımında GPU uyumluluğunu korur", () => {
    const raw = `MACBOOK AIR M2 13.6" UZAY GRİSİ
• Apple M2 Çip
• 8/256
• Pil Sağlığı %95
• Orijinal Şarj Aleti`;

    const res = parseAdDescription(raw);
    expect(res.subtitle).toBe("APPLE MACBOOK AIR");
    expect(res.specs.find((s) => s.icon === "cpu")?.v).toBe("Apple M2");
    expect(res.specs.find((s) => s.icon === "ram")?.v).toBe("8 GB");
    expect(res.specs.find((s) => s.icon === "ssd")?.v).toBe("256 GB SSD");
    expect(res.specs.find((s) => s.icon === "gpu")?.v).toBe("Apple M2 Entegre GPU");
    expect(res.boxLine1).toBe("Orijinal Şarj Aleti");
  });

  it("06. HP Victus 16 modern 14. nesil HX işlemci ve watt değerini ayrıştırır", () => {
    const raw = `HP VICTUS 16-R1041NT
İşlemci: Intel Core i5-14500HX
Ekran Kartı: RTX 4060 8GB 120W
RAM: 16 GB DDR5 5600MHz
SSD: 1 TB PCIe Gen4 NVMe M.2
Ekran: 16.1" FHD IPS 144Hz`;

    const res = parseAdDescription(raw);
    expect(res.subtitle).toBe("GAMING LAPTOP");
    expect(res.specs.find((s) => s.icon === "cpu")?.v).toBe("Intel Core i5-14500HX");
    expect(res.specs.find((s) => s.icon === "gpu")?.v).toBe("RTX 4060 · 8 GB · 120W");
    expect(res.specs.find((s) => s.icon === "ram")?.v).toBe("16 GB 5600 MHz DDR5");
    expect(res.specs.find((s) => s.icon === "ssd")?.v).toBe("1 TB PCIe Gen4 NVMe M.2 SSD");
    expect(res.specs.find((s) => s.icon === "screen")?.v).toBe("16.1 inç FHD IPS 144 Hz");
  });

  it("07. Dell Latitude / ThinkPad iş bilgisayarı + Iris Xe + Parmak İzi + Metal Kasa laptopu masaüstü sanmaz", () => {
    const raw = `DELL LATITUDE 7430 KURUMSAL ULTRABOOK
• Intel Core i7-1265U
• Intel Iris Xe Graphics
• 16 GB DDR4 RAM
• 512 GB NVMe SSD
• 14 inç FHD IPS
• Alüminyum Kasa, Parmak İzi Okuyucu, Aydınlatmalı Türkçe Q Klavye`;

    const res = parseAdDescription(raw);
    expect(res.subtitle).toBe("İŞ & ULTRABOOK");
    expect(res.specs.find((s) => s.icon === "mobo")).toBeUndefined();
    expect(res.specs.find((s) => s.icon === "psu")).toBeUndefined();
    expect(res.specs.find((s) => s.icon === "gpu")?.v).toContain("Iris Xe");
    const extras = res.specs.find((s) => s.icon === "extras")?.v || "";
    expect(extras).toContain("Parmak İzi Okuyucu");
    expect(extras).toContain("Metal / Alüminyum Kasa");
  });

  it("08. Çift diskli (SSD + HDD) yapılandırmayı eksiksiz çıkarır", () => {
    const raw = `MONSTER ABRA A5 V17.2
• i5-11400H
• RTX 3050 Ti 4GB
• 16 GB DDR4 3200MHz
• 512 GB NVMe SSD + 1 TB HDD
• 15.6" FHD 144Hz`;

    const res = parseAdDescription(raw);
    const ssd = res.specs.find((s) => s.icon === "ssd")?.v || "";
    expect(ssd).toContain("512 GB NVMe SSD");
    expect(ssd).toContain("1 TB HDD");
  });

  it("09. Kısaltma 16/512 ve ekstra donanım özelliklerini doğru işler", () => {
    const raw = `THINKPAD X1 CARBON GEN 10 | i7-1260P | 16/512 | 14" WUXGA IPS
Parmak İzi Okuyucu • Türkçe Q Aydınlatmalı Klavye
Stok Kodu: X1-44`;

    const res = parseAdDescription(raw);
    expect(res.title).toBe("THINKPAD X1 CARBON GEN 10");
    expect(res.stockCode).toBe("X1-44");
    expect(res.specs.find((s) => s.icon === "ram")?.v).toBe("16 GB");
    expect(res.specs.find((s) => s.icon === "ssd")?.v).toBe("512 GB SSD");
    expect(res.specs.find((s) => s.icon === "screen")?.v).toContain("14 inç WUXGA IPS");
  });

  it("10. Tek parçada bitişik '8GB RAM 256GB SSD' yazımını karıştırmaz", () => {
    const raw = `LENOVO IDEAPAD SLIM 3 | İ5-1235U | 8GB RAM 256GB SSD | 15.6" FHD`;
    const res = parseAdDescription(raw);
    expect(res.specs.find((s) => s.icon === "cpu")?.v).toContain("1235U");
    expect(res.specs.find((s) => s.icon === "ram")?.v).toBe("8 GB");
    expect(res.specs.find((s) => s.icon === "ssd")?.v).toBe("256 GB SSD");
    expect(res.specs.find((s) => s.icon === "screen")?.v).toContain("15.6 inç FHD");
  });

  it("11. Sahibinden dikey Key\\nValue kopyala-yapıştır tablo formatını ayrıştırır", () => {
    const raw = `EXCALIBUR G870 GAMING LAPTOP
İşlemci
i5-12450H
RAM
16 GB DDR4
SSD
512 GB
Ekran Kartı
RTX 4050 6GB
Ekran Boyutu
15.6 inç`;

    const res = parseAdDescription(raw);
    expect(res.title).toBe("EXCALIBUR G870 GAMING LAPTOP");
    expect(res.specs.find((s) => s.icon === "cpu")?.v).toBe("Intel Core i5-12450H");
    expect(res.specs.find((s) => s.icon === "ram")?.v).toBe("16 GB DDR4");
    expect(res.specs.find((s) => s.icon === "ssd")?.v).toBe("512 GB SSD");
    expect(res.specs.find((s) => s.icon === "gpu")?.v).toBe("RTX 4050 · 6 GB");
    expect(res.specs.find((s) => s.icon === "screen")?.v).toBe("15.6 inç");
  });

  it("12. Sahibinden sekme (TAB) ayrımlı tablo + ayrı VRAM satırını birleştirir", () => {
    const raw = `ASUS TUF GAMING F15
İşlemci\ti7-12700H
Ekran Kartı\tNVIDIA GeForce RTX 4060
Ekran Kartı Hafızası\t8 GB
RAM (Sistem Belleği)\t16 GB DDR4
Sabit Disk (SSD)\t1 TB
Ekran Boyutu\t15,6 inç`;

    const res = parseAdDescription(raw);
    expect(res.specs.find((s) => s.icon === "gpu")?.v).toBe("RTX 4060 · 8 GB");
    expect(res.specs.find((s) => s.icon === "ssd")?.v).toBe("1 TB SSD");
    expect(res.specs.find((s) => s.icon === "screen")?.v).toBe("15.6 inç");
  });

  it("13. Çoklu anahtar içeren pipe satırı + Core Ultra 7 155H işlemcisini ayrıştırır", () => {
    const raw = `HP OMEN 16
İşlemci: Core Ultra 7 155H | Ekran Kartı: RTX 4070 8GB | RAM: 16 GB DDR5 | SSD: 1 TB NVMe
Win 11 Pro Lisanslı • Kozmetik 10/10`;

    const res = parseAdDescription(raw);
    expect(res.specs.find((s) => s.icon === "cpu")?.v).toContain("Ultra 7 155H");
    expect(res.specs.find((s) => s.icon === "gpu")?.v).toBe("RTX 4070 · 8 GB");
    expect(res.specs.find((s) => s.icon === "ram")?.v).toBe("16 GB DDR5");
    expect(res.specs.find((s) => s.icon === "ssd")?.v).toBe("1 TB NVMe SSD");
    expect(res.specs.find((s) => s.icon === "extras")?.v).toContain("Windows 11 Pro");
  });

  it("14. AMD Ryzen AI 9 HX 370 + Radeon 890M yeni nesil APU laptopu ayrıştırır", () => {
    const raw = `ASUS ZENBOOK S 16 OLED
• AMD Ryzen AI 9 HX 370
• AMD Radeon 890M Graphics
• 32 GB LPDDR5X 7500MHz RAM
• 1 TB PCIe Gen4 NVMe SSD
• 16 inç 3K OLED 120Hz`;

    const res = parseAdDescription(raw);
    expect(res.specs.find((s) => s.icon === "cpu")?.v).toBe("AMD Ryzen AI 9 HX 370");
    expect(res.specs.find((s) => s.icon === "gpu")?.v).toContain("Radeon 890M");
    expect(res.specs.find((s) => s.icon === "ram")?.v).toBe("32 GB 7500 MHz LPDDR5X");
    expect(res.specs.find((s) => s.icon === "screen")?.v).toContain("16 inç 3K OLED 120 Hz");
  });

  it("15. Mobil İş İstasyonu (Workstation / RTX Ada) sınıfını doğru algılar", () => {
    const raw = `DELL PRECISION 5680 WORKSTATION
• Intel Core i9-13900H
• NVIDIA RTX 2000 Ada 8GB GDDR6
• 64 GB DDR5 RAM
• 2 TB NVMe SSD`;

    const res = parseAdDescription(raw);
    expect(res.subtitle).toBe("İŞ İSTASYONU / WORKSTATION");
    expect(res.specs.find((s) => s.icon === "gpu")?.v).toContain("RTX 2000 Ada");
    expect(res.specs.find((s) => s.icon === "ram")?.v).toBe("64 GB DDR5");
  });

  it("16. Masaüstü PC (ULTRA GAMING BEYAZ SİSTEM / M-239) tam çapraz-alan korumasıyla ayrıştırır", () => {
    const raw = `ULTRA GAMING BEYAZ SİSTEM - ULTRA 5 245KF CPU - RTX 5060 Ti 16GB EKRAN KARTI - 240mm SIVI SOĞUTMA - SIFIR - GARANTİLİ - KUTU + FATURA

- INTEL CORE ULTRA 5 245KF 5.2GHz 14. Çekirdek İşlemci

- GIGABYTE RTX 5060Ti EAGLE MAX OC 16G 16GB GDDR7 128 BİT DLSS 4 EKRAN KARTI Gaming (Oyuncu) Ekran Kartı

- 1x16GB CRUCIAL PRO 6000MHz DDR5 RAM Bellek

- 1TB Lexar NQ780 PCIe Gen4 NVMe M.2 SSD SSD Depolama

- ASRock H810M-X WiFi DDR5 6400MHz GEN4 M2 Anakart

- POWERBOOST CIRCLE 240W 240mm PB-LCS-CR240W İşlemci Sıvı Soğutma

- FAZEON 750W 80+ Bronze Güç Kaynağı

- FAZEON WHITE F19 4x120mm ARGB Fanlı ATX Beyaz Gaming Kasa

- Ekran Kartı Dahil Tüm Parçalar Sıfır ve Garantilidir. Ekran Kartı Kapalı kutu demonte şekildedir.

- Kutu ve Fatura Mevcut.

KONGORU
Serdivan / Sakarya

STOK KODU: M-239`;

    const r = parseAdDescription(raw);
    const cpu = r.specs.find((s) => s.icon === "cpu")?.v || "";
    const gpu = r.specs.find((s) => s.icon === "gpu")?.v || "";
    const ram = r.specs.find((s) => s.icon === "ram")?.v || "";
    const ssd = r.specs.find((s) => s.icon === "ssd")?.v || "";
    const moboRow = r.specs.find((s) => s.icon === "mobo");
    const psuRow = r.specs.find((s) => s.icon === "psu");
    const extrasRow = r.specs.find((s) => s.icon === "extras");

    expect(r.title).toBe("ULTRA GAMING BEYAZ SİSTEM");
    expect(r.subtitle).toBe("GAMING SİSTEM");
    expect(r.stockCode).toBe("M-239");
    expect(cpu).toContain("Ultra 5 245KF");
    expect(cpu).toContain("5.2 GHz");
    expect(cpu).toContain("14 Çekirdek");
    expect(gpu).toContain("RTX 5060 Ti");
    expect(gpu).toContain("16 GB GDDR7");
    expect(gpu).toContain("128 Bit");
    expect(gpu).not.toMatch(/dlss|oyuncu|ekran kart/i);
    expect(ram).toContain("1x16 GB");
    expect(ram).toContain("6000 MHz");
    expect(ram).toContain("DDR5");
    expect(ram).not.toMatch(/ssd|6400|nq780/i);
    expect(ssd).toContain("1 TB");
    expect(ssd).toContain("Lexar NQ780");
    expect(ssd).toContain("NVMe");
    expect(ssd).not.toMatch(/ssd\s+ssd|ddr5|6000|h810m/i);
    expect(moboRow?.k).toBe("ANAKART");
    expect(moboRow?.v).toContain("H810M-X");
    expect(psuRow?.k).toBe("SOĞUTMA & PSU");
    expect(psuRow?.v).toContain("240mm");
    expect(psuRow?.v).toContain("750W 80+ Bronze");
    expect(extrasRow?.k).toBe("KASA & ÖZELLİKLER");
    expect(extrasRow?.v).toContain("F19");
    expect(extrasRow?.v).not.toMatch(/demonte|garantilidir/i);
    expect(r.boxLine1).toBe("Orijinal Kutu · Fatura");
    expect(r.boxLine2).toContain("Demonte");
  });

  it("17. Masaüstü PC (Ryzen 7 7800X3D + Hava Soğutucu + Corsair RM750e) ayrıştırır", () => {
    const raw = `PHOENIX RYZEN OYUNCU KASASI
İşlemci: AMD Ryzen 7 7800X3D
Ekran Kartı: MSI RTX 4070 Super Ventus 2X 12GB
RAM: 2x16GB Kingston Fury Beast 6000MHz DDR5
Depolama: 2TB Samsung 990 Pro M.2 NVMe SSD
Anakart: ASUS TUF GAMING B650M-PLUS WIFI
Soğutma: Thermalright Peerless Assassin 120 Kule Tipi Soğutucu
Güç Kaynağı: Corsair RM750e 750W 80+ Gold
Kasa: NZXT H5 Flow Siyah ATX
Stok Kodu: M-410`;

    const r = parseAdDescription(raw);
    expect(r.title).toBe("PHOENIX RYZEN OYUNCU KASASI");
    expect(r.subtitle).toBe("GAMING SİSTEM");
    expect(r.stockCode).toBe("M-410");
    expect(r.specs.find((s) => s.icon === "cpu")?.v).toBe("AMD Ryzen 7 7800X3D");
    const gpu = r.specs.find((s) => s.icon === "gpu")?.v || "";
    expect(gpu).toContain("RTX 4070 Super");
    expect(gpu).toContain("Ventus 2X");
    expect(gpu).toContain("12 GB");
    const ram = r.specs.find((s) => s.icon === "ram")?.v || "";
    expect(ram).toContain("2x16 GB");
    expect(ram).toContain("Kingston Fury Beast");
    expect(ram).toContain("DDR5");
    const ssd = r.specs.find((s) => s.icon === "ssd")?.v || "";
    expect(ssd).toContain("2 TB");
    expect(ssd).toContain("Samsung 990 Pro");
    expect(ssd).toContain("NVMe");
    expect(r.specs.find((s) => s.icon === "mobo")?.v).toContain("B650M-PLUS");
    const psu = r.specs.find((s) => s.icon === "psu")?.v || "";
    expect(psu).toContain("120");
    expect(psu).toContain("750W 80+ Gold");
    const ext = r.specs.find((s) => s.icon === "extras")?.v || "";
    expect(ext).toContain("NZXT H5 Flow");
    expect(ext).toContain("Kasa");
  });

  it("18. Masaüstü PC (AMD RX 7800 XT Sapphire Nitro+ + B650 Anakart) M.2 sızıntısı yapmaz", () => {
    const raw = `KONGORU KIRMIZI EJDERHA MASAÜSTÜ SİSTEM
- AMD Ryzen 5 7500F
- SAPPHIRE RX 7800 XT NITRO+ 16GB GDDR6
- 2x16GB CORSAIR VENGEANCE 5600MHz DDR5
- 1TB KINGSTON NV2 NVMe M.2 SSD
- MSI PRO B650M-B GEN4 M.2 ANAKART
- FSP HYDRO K PRO 750W 80+ Bronze PSU
- DEEPCOOL CC560 4x120mm Mesh Kasa`;

    const r = parseAdDescription(raw);
    expect(r.specs.find((s) => s.icon === "cpu")?.v).toBe("AMD Ryzen 5 7500F");
    expect(r.specs.find((s) => s.icon === "gpu")?.v).toContain("Sapphire RX 7800 XT Nitro+ · 16 GB GDDR6");
    expect(r.specs.find((s) => s.icon === "ram")?.v).toContain("32 GB (2x16 GB) Corsair Vengeance");
    expect(r.specs.find((s) => s.icon === "ssd")?.v).toContain("1 TB Kingston NV2");
    expect(r.specs.find((s) => s.icon === "mobo")?.v).toContain("B650M-B");
  });

  it("19. Türkçe büyük İ / küçük ı harfleriyle yazılmış masaüstü donanımlarını doğru yakalar", () => {
    const raw = `OYUNCU BİLGİSAYARI HAZIR SİSTEM
İŞLEMCİ: İ5-14400F
EKRAN KARTI: RTX 4060 Tİ 8GB
RAM: 2X8GB G.SKILL 3200MHZ DDR4
SSD: 500GB NVME M2 SSD
ANAKART: ASUS PRIME H610M-K
GÜÇ KAYNAĞI: FSP 650W 80+ BRONZE`;

    const r = parseAdDescription(raw);
    expect(r.subtitle).toBe("GAMING SİSTEM");
    expect(r.specs.find((s) => s.icon === "cpu")?.v).toBe("Intel Core i5-14400F");
    expect(r.specs.find((s) => s.icon === "gpu")?.v).toBe("RTX 4060 Ti · 8 GB");
    expect(r.specs.find((s) => s.icon === "ram")?.v).toContain("16 GB (2x8 GB)");
    expect(r.specs.find((s) => s.icon === "ssd")?.v).toContain("500 GB NVMe M.2 SSD");
  });

  it("20. RAM satırındaki '(64 GB kadar artırılabilir)' ifadesinden yanlış kapasite çekmez", () => {
    const raw = `ASUS ROG STRIX G16
• Intel Core i7-13650HX
• RTX 4060 8GB
• 16 GB DDR5 (64 GB'a kadar artırılabilir)
• 1 TB NVMe SSD`;

    const r = parseAdDescription(raw);
    expect(r.specs.find((s) => s.icon === "ram")?.v).toBe("16 GB DDR5");
  });

  it("21. Telefon, konum, fiyat ve Sahibinden link satırlarını donanıma karıştırmaz", () => {
    const raw = `ACER NITRO 5 AN515-58
• i7-12650H | RTX 4050 6GB | 16 GB DDR5 | 512 GB SSD | 15.6" 144Hz
Mağaza Konumu: Serdivan / Sakarya
Fiyat: 31.999 TL
https://www.sahibinden.com/ilan/123456
WhatsApp: 0555 444 33 22`;

    const r = parseAdDescription(raw);
    expect(r.title).toBe("ACER NITRO 5 AN515-58");
    expect(r.specs.find((s) => s.icon === "cpu")?.v).toBe("Intel Core i7-12650H");
    expect(r.specs.find((s) => s.icon === "ram")?.v).toBe("16 GB DDR5");
    expect(r.specs.find((s) => s.icon === "extras")).toBeUndefined();
  });

  it("22. Çoklu ilan ayırıcısı (--- ve ===) ile birden fazla ilanı doğru böler", () => {
    const raw = `LAPTOP 1 | i5-12450H
---
LAPTOP 2 | i7-13700H
===
KASA 3 | Ryzen 5 7500F`;
    const parts = splitMultipleAds(raw);
    expect(parts).toHaveLength(3);
    expect(parts[0]).toContain("LAPTOP 1");
    expect(parts[1]).toContain("LAPTOP 2");
    expect(parts[2]).toContain("KASA 3");
  });

  it("23. Boş girişte güvenli varsayılan etiket alanları döndürür", () => {
    const r = parseAdDescription("");
    expect(r.title).toBe("YENİ CİHAZ ETİKETİ");
    expect(r.specs.length).toBeGreaterThanOrEqual(5);
    expect(r.warrantyDetail).toBe("Kongoru Firma Garantisi");
  });

  it("24. Manuel düzenleme (applyOverrides) sadece değiştirilen alanları günceller", () => {
    const parsed = parseAdDescription(`LENOVO LOQ | i5-13420H | RTX 4050 6GB | 16 GB | 512 GB SSD`);
    const overridden = applyOverrides(parsed, {
      stockCode: "ÖZEL-99",
      specs: { 2: { v: "32 GB DDR5 (Upgrade)" } },
    });
    expect(overridden.stockCode).toBe("ÖZEL-99");
    expect(overridden.specs[2].v).toBe("32 GB DDR5 (Upgrade)");
    expect(overridden.specs[0].v).toBe("Intel Core i5-13420H");
  });

  it("25. Üst segment Workstation Masaüstü (Ryzen 9 9950X + RTX 4090 + 64GB + 4TB)", () => {
    const raw = `PRO RENDER WORKSTATION SİSTEM
- AMD Ryzen 9 9950X 5.7GHz 16 Çekirdek
- ASUS ROG Strix RTX 4090 OC 24GB GDDR6X
- 2x32GB G.Skill Trident Z5 6400MHz DDR5
- 4TB Samsung 990 Pro PCIe Gen4 NVMe SSD
- ASUS ProArt X670E-CREATOR WIFI Anakart
- Arctic Liquid Freezer II 360mm Sıvı Soğutma
- Seasonic Vertex GX-1000 1000W 80+ Gold PSU
- Lian Li O11 Dynamic EVO ATX Kasa`;

    const r = parseAdDescription(raw);
    expect(r.subtitle).toBe("WORKSTATION SİSTEM");
    expect(r.specs.find((s) => s.icon === "cpu")?.v).toContain("AMD Ryzen 9 9950X");
    expect(r.specs.find((s) => s.icon === "gpu")?.v).toContain("RTX 4090");
    expect(r.specs.find((s) => s.icon === "gpu")?.v).toContain("24 GB GDDR6X");
    expect(r.specs.find((s) => s.icon === "ram")?.v).toContain("64 GB (2x32 GB)");
    expect(r.specs.find((s) => s.icon === "ssd")?.v).toContain("4 TB Samsung 990 Pro");
    expect(r.specs.find((s) => s.icon === "mobo")?.v).toContain("X670E");
  });

  it("26. FreeDOS, MUX Switch, Wi-Fi 6E ve Yüz Tanıma ek özelliklerini yakalar", () => {
    const raw = `LENOVO LEGION PRO 5
• Intel Core i9-14900HX | RTX 4070 8GB | 32 GB DDR5 | 1 TB NVMe | 16" WQXGA IPS 240Hz
• MUX Switch, Wi-Fi 6E, FreeDOS, RGB Aydınlatmalı Türkçe Q Klavye`;

    const r = parseAdDescription(raw);
    const extras = r.specs.find((s) => s.icon === "extras")?.v || "";
    expect(extras).toContain("MUX Switch");
    expect(extras).toContain("FreeDOS");
    expect(extras).toContain("Aydınlatmalı Klavye");
    expect(r.specs.find((s) => s.icon === "screen")?.v).toContain("WQXGA");
    expect(r.specs.find((s) => s.icon === "screen")?.v).toContain("240 Hz");
  });

  it("27. Artı (+) ile birleştirilmiş Lenovo LOQ başlık ve garanti bilgisini doğru böler", () => {
    const raw = `LENOVO LOQ 15IRH8 | RTX 4060 + İ7-13620H + 16GB DDR5 + 512GB SSD | 15.6" 144Hz | KUTU + FATURA | 9 AY GARANTİLİ
Ödeme ve Ürünlerimiz ile ilgili detaylar için işletmemizi ziyaret edebilir veya numaramızdan bizlere ulaşabilirsiniz.`;

    const r = parseAdDescription(raw);
    expect(r.title).toBe("LENOVO LOQ 15IRH8");
    expect(r.specs.find((s) => s.icon === "cpu")?.v).toBe("Intel Core i7-13620H");
    expect(r.specs.find((s) => s.icon === "gpu")?.v).toBe("RTX 4060");
    expect(r.specs.find((s) => s.icon === "ram")?.v).toBe("16 GB DDR5");
    expect(r.specs.find((s) => s.icon === "ssd")?.v).toBe("512 GB SSD");
    expect(r.specs.find((s) => s.icon === "screen")?.v).toBe("15.6 inç 144 Hz");
    expect(r.boxLine1).toBe("Orijinal Kutu · Fatura");
    expect(r.warrantyDuration).toContain("9 Ay");
  });

  it("28. Pipesız tek satır HP Victus başlığında tüm donanımları karıştırmadan ayrıştırır", () => {
    const raw = `HP VICTUS 16 RTX 4060 İ5-14500HX 16GB RAM 1TB SSD 16.1 İNÇ 144HZ KUTULU 6 AY GARANTİLİ
• Batarya Sağlam
• (Türkçe Q) RGB Klavye`;

    const r = parseAdDescription(raw);
    expect(r.title).toBe("HP VICTUS 16");
    expect(r.specs.find((s) => s.icon === "cpu")?.v).toBe("Intel Core i5-14500HX");
    expect(r.specs.find((s) => s.icon === "gpu")?.v).toBe("RTX 4060");
    expect(r.specs.find((s) => s.icon === "ram")?.v).toBe("16 GB");
    expect(r.specs.find((s) => s.icon === "ssd")?.v).toBe("1 TB SSD");
    expect(r.specs.find((s) => s.icon === "screen")?.v).toBe("16.1 inç 144 Hz");
    expect(r.specs.find((s) => s.icon === "battery")?.v).toContain("Sağlam");
  });

  it("29. Tireli Ryzen kısaltması (R7-7735HS) + çoklu ilan ayırıcılarını doğru okur", () => {
    const raw = `ASUS TUF A15 | RTX 4050 + R7-7735HS + 16GB RAM + 512GB SSD`;
    const r = parseAdDescription(raw);
    expect(r.title).toBe("ASUS TUF A15");
    expect(r.specs.find((s) => s.icon === "cpu")?.v).toBe("AMD Ryzen 7 7735HS");
    expect(r.specs.find((s) => s.icon === "gpu")?.v).toBe("RTX 4050");
    expect(r.specs.find((s) => s.icon === "ram")?.v).toBe("16 GB");
    expect(r.specs.find((s) => s.icon === "ssd")?.v).toBe("512 GB SSD");
  });

  it("30. aciklamalar.md içindeki 24 gerçek Kongoru ilanının tamamını hatasız ve eksiksiz ayrıştırır", () => {
    const ads = splitMultipleAds(aciklamalarMd);
    expect(ads).toHaveLength(24);

    const parsed = ads.map((ad) => parseAdDescription(ad));
    for (const p of parsed) {
      expect(p.specs.length).toBeGreaterThan(0);
      expect(p.specs.every((s) => s.v !== "-")).toBe(true);
    }

    expect(parsed.map((p) => p.stockCode)).toEqual([
      "L-1007",
      "L-1008",
      "L-975",
      "M-239",
      "L-976",
      "M-250",
      "",
      "L-1006",
      "L-974",
      "L-1001, L-1002, L-1003",
      "L-940",
      "L-1000",
      "L-914",
      "M202-203-204",
      "L-927, L-928",
      "",
      "L-764",
      "M-230, M-231, M-232, M-233, M-234",
      "M-264",
      "M-262",
      "M-262",
      "L-835",
      "M-177",
      "",
    ]);

    const findSpec = (index: number, key: string) =>
      parsed[index].specs.find((s) => s.k === key || s.icon === key)?.v;

    // #1 Acer Aspire Go 15
    expect(parsed[0].title).toBe("ACER ASPIRE GO 15 AG15-71P");
    expect(parsed[0].warrantyDuration).toBe("26.08.2027'e Kadar");
    expect(parsed[0].warrantyDetail).toBe("Acer Resmi Garantisi");

    // #3 MacBook Air M4
    expect(parsed[2].title).toBe("MACBOOK AIR M4");
    expect(findSpec(2, "cpu")).toBe("Apple M4");
    expect(findSpec(2, "gpu")).toBe("Apple M4 Entegre GPU");
    expect(findSpec(2, "battery")).toBe("Sağlık %99 · 79 Devir");

    // #6 Full Sıfır Gaming PC
    expect(parsed[5].title).toBe("FULL SIFIR GAMING PC");
    expect(findSpec(5, "gpu")).toBe("ZOTAC RTX 5060 Gaming Twin Edge · 8 GB GDDR7 · 128 Bit");
    expect(findSpec(5, "ram")).toBe("16 GB (2x8 GB) Hikvision U10 · 3200 MHz DDR4");

    // #7 Dell P2421D Monitör
    expect(parsed[6].title).toBe("DELL P2421D");
    expect(parsed[6].subtitle).toBe("MONİTÖR");
    expect(findSpec(6, "EKRAN & PANEL")).toBe("24 inç · IPS · Düz Panel · Mat");
    expect(findSpec(6, "ÇÖZÜNÜRLÜK")).toBe("2K WQHD (2560×1440)");
    expect(findSpec(6, "BAĞLANTI PORTLARI")).toBe("1x HDMI · 1x DisplayPort");

    // #9 MacBook Pro M3 Pro
    expect(parsed[8].title).toBe("MACBOOK PRO M3 PRO");
    expect(findSpec(8, "cpu")).toBe("Apple M3 Pro · 12 Çekirdek");
    expect(findSpec(8, "gpu")).toBe("Apple M3 Pro · 19 Çekirdek GPU");
    expect(parsed[8].boxLine2).toBe("Kutu & Fatura Yok");

    // #10 HP EliteBook 840 G8
    expect(parsed[9].title).toBe("HP ELITEBOOK 840 G8");
    expect(findSpec(9, "cpu")).toBe("Intel Core i5-1145G7 · 4.40 GHz · 4 Çekirdek");

    // #11 Dell XPS 17 9700
    expect(parsed[10].title).toBe("DELL XPS 17 9700");
    expect(findSpec(10, "gpu")).toBe("RTX 2060 Max-Q · 6 GB");
    expect(findSpec(10, "screen")).toBe("17.0 inç 4K UHD Dokunmatik");

    // #14 HP ProDesk All-in-One
    expect(parsed[13].subtitle).toBe("ALL-IN-ONE PC");
    expect(findSpec(13, "cpu")).toBe("Intel Core i5-9500T · 3.70 GHz · 6 Çekirdek");
    expect(findSpec(13, "gpu")).toBe("Intel UHD Graphics 630");
    expect(findSpec(13, "screen")).toBe("24 inç FHD");

    // #15 Lenovo ThinkPad E14 Gen7
    expect(parsed[14].title).toBe("LENOVO THINKPAD E14 GEN7");
    expect(findSpec(14, "gpu")).toBe("Intel Arc 140T Graphics");
    expect(parsed[14].warrantyDuration).toBe("28 Ay Garantili");
    expect(parsed[14].warrantyDetail).toBe("Lenovo Resmi Garantisi");
    expect(parsed[14].boxLine2).toBe("Sıfır Ürün · Kutusuz");

    // #16 HP Compaq 6300 Pro SFF
    expect(parsed[15].title).toBe("HP COMPAQ 6300 PRO SFF");
    expect(parsed[15].subtitle).toBe("MASAÜSTÜ BİLGİSAYAR");
    expect(findSpec(15, "gpu")).toBe("Intel HD 2500 Graphics");
    expect(findSpec(15, "ssd")).toBe("240 GB SATA SSD");

    // #19 Lenovo ThinkCentre M720Q
    expect(parsed[18].title).toBe("LENOVO THINKCENTRE M720Q");
    expect(parsed[18].subtitle).toBe("MİNİ MASAÜSTÜ PC");

    // #20 & #21 Ultra Gaming Beyaz Sistem
    expect(findSpec(19, "cpu")).toBe("Intel Core Ultra 5 250KF Plus · 5.3 GHz · 18 Çekirdek");
    expect(findSpec(19, "ram")).toBe("1x16 GB G.Skill Flare X5 · 6000 MHz DDR5");
    expect(findSpec(19, "ssd")).toBe("512 GB Western Digital SN740 · PCIe Gen4 NVMe M.2 SSD");
    expect(findSpec(20, "gpu")).toBe("MSI RTX 5070 Inspire 3X OC · 12 GB GDDR7 · 128 Bit");

    // #22 Asus Vivobook 16 Snapdragon
    expect(parsed[21].title).toBe("ASUS VIVOBOOK 16 X1607Q MB052W");
    expect(findSpec(21, "cpu")).toBe("Qualcomm Snapdragon X Oryon · 3.00 GHz · 8 Çekirdek");
    expect(findSpec(21, "gpu")).toBe("Qualcomm Adreno GPU");

    // #23 Rampage 25" 300Hz Monitör
    expect(parsed[22].title).toBe('RAMPAGE 25" 300HZ GAMING MONİTÖR');
    expect(parsed[22].subtitle).toBe("GAMING MONİTÖR");
    expect(findSpec(22, "YENİLEME & TEPKİME")).toBe("300 Hz · 1 ms");
    expect(findSpec(22, "BAĞLANTI PORTLARI")).toBe("2x HDMI · 1x DisplayPort");

    // #24 Samsung Odyssey 24" Monitör
    expect(parsed[23].title).toBe("SAMSUNG ODYSSEY PİVOT");
    expect(parsed[23].subtitle).toBe("GAMING MONİTÖR");
    expect(findSpec(23, "EKRAN & PANEL")).toBe("24 inç · VA · Mat");
    expect(findSpec(23, "YENİLEME & TEPKİME")).toBe("180 Hz · 1 ms");
  });

  it("31. Ham Sahibinden 'Serdivan / Sakarya' + alttaki STOK KODU birleşik çoklu ilanlarını böler", () => {
    const rawConcatenated = `MACBOOK AIR M4 - 16GB RAM - 256GB SSD
- Apple M4 İşlemci
- 16GB RAM
- 256GB SSD
KONGORU
Serdivan / Sakarya
STOK L-975
RAMPAGE - 25 INCH - PİVOT - 300Hz - 1MS - GAMING MONITOR
- 25 inç FullHD Slim Flat Düz Panel
- 300Hz Yenileme, 1 Ms Tepki Süreci
- 2xHDMI, 1xDisplayPort
KONGORU
Serdivan / Sakarya
STOK KODU M-177`;

    const ads = splitMultipleAds(rawConcatenated);
    expect(ads).toHaveLength(2);

    const first = parseAdDescription(ads[0]);
    const second = parseAdDescription(ads[1]);

    expect(first.title).toBe("MACBOOK AIR M4");
    expect(first.stockCode).toBe("L-975");
    expect(second.title).toBe('RAMPAGE 25" 300HZ GAMING MONİTÖR');
    expect(second.stockCode).toBe("M-177");
  });
});
