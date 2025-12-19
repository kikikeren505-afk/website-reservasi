// Lokasi: app/reservasi/page.tsx
// ✅ PERUBAHAN: Ganti handleSubmit dan tambah fetch harga kost real

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ReservasiPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const kostId = searchParams.get('kost_id');

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [kostData, setKostData] = useState<any>(null);
  const [loadingKost, setLoadingKost] = useState(true);
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    telepon: '',
    ktp: '',
    kost_id: kostId || '1',
    tanggal_mulai: '',
    durasi: '12',
    catatan: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // ✅ Cek apakah di browser dulu
    if (typeof window !== 'undefined') {
      const userData = sessionStorage.getItem('user') || localStorage.getItem('user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          // Auto-fill form dengan data user jika ada
          setFormData(prev => ({
            ...prev,
            nama: parsedUser.name || '',
            email: parsedUser.email || '',
          }));
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    }

    // ✅ Fetch data kost dari database
    fetchKostData();
  }, []);

  // ✅ FUNGSI BARU: Fetch data kost real dari API
  const fetchKostData = async () => {
    try {
      setLoadingKost(true);
      const response = await fetch('/api/admin/kost', {
        cache: 'no-store',
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setKostData(data.data);
      }
    } catch (error) {
      console.error('Error fetching kost:', error);
    } finally {
      setLoadingKost(false);
    }
  };

  // ✅ Mapping data kost dari database
  const kostOptions = kostData ? kostData.map((k: any) => ({
    id: k.id.toString(),
    nama: k.nama,
    harga: k.harga,
    alamat: k.alamat
  })) : [];

  const selectedKost = kostOptions.find((k: any) => k.id === formData.kost_id);

  // ✅ Hitung total harga berdasarkan durasi
  const calculateTotal = () => {
    if (!selectedKost) return 0;
    const hargaPerTahun = selectedKost.harga;
    const durasi = parseInt(formData.durasi);
    return Math.round((hargaPerTahun / 12) * durasi);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // ✅ FUNGSI SUBMIT YANG DIPERBAIKI - KIRIM KE API REAL
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi user login
    if (!user || !user.id) {
      alert('Anda harus login terlebih dahulu!');
      router.push('/login');
      return;
    }

    setLoading(true);

    try {
      const totalHarga = calculateTotal();
      
      // ✅ Kirim data ke API
      const response = await fetch('/api/reservasi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          kost_id: parseInt(formData.kost_id),
          tanggal_mulai: formData.tanggal_mulai,
          durasi_bulan: parseInt(formData.durasi),
          total_harga: totalHarga,
          catatan: formData.catatan || null
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Reservasi berhasil dibuat:', data);
        setSuccess(true);
        
        // Refresh data dan redirect
        router.refresh();
        setTimeout(() => {
          router.push('/dashboard/reservasi');
        }, 2000);
      } else {
        alert(data.message || 'Gagal membuat reservasi. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error creating reservasi:', error);
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingKost) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom, #f8fafc 0%, #e2e8f0 100%)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite',
          }}></div>
          <p style={{ color: '#64748b' }}>Memuat data kost...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={styles.container}>
        <div style={{
          ...styles.successCard,
          opacity: 1,
          transform: 'scale(1)',
          animation: 'successPop 0.6s ease-out',
        }}>
          <div style={styles.successIcon}>✓</div>
          <h1 style={styles.successTitle}>Reservasi Berhasil!</h1>
          <p style={styles.successText}>
            Terima kasih atas reservasi Anda. Kami akan menghubungi Anda segera untuk konfirmasi lebih lanjut.
          </p>
          <p style={styles.successSubtext}>
            Anda akan diarahkan ke dashboard dalam beberapa detik...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{
        ...styles.header,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(-30px)',
        transition: 'all 1s ease-out',
      }}>
        <h1 style={styles.title}>Form Reservasi Kost</h1>
        <p style={styles.subtitle}>Lengkapi data di bawah ini untuk melakukan reservasi</p>
      </div>

      <div style={styles.content}>
        <div style={styles.grid}>
          <form 
            onSubmit={handleSubmit} 
            style={{
              ...styles.form,
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateX(0)' : 'translateX(-30px)',
              transition: 'all 0.8s ease-out 0.3s',
            }}
          >
            <h2 style={styles.sectionTitle}>Data Pribadi</h2>

            <div style={styles.formGroup}>
              <label style={styles.label}>Nama Lengkap *</label>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="Masukkan nama lengkap sesuai KTP"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="nama@email.com"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Nomor Telepon / WhatsApp *</label>
              <input
                type="tel"
                name="telepon"
                value={formData.telepon}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="08xx-xxxx-xxxx"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Nomor KTP *</label>
              <input
                type="text"
                name="ktp"
                value={formData.ktp}
                onChange={handleChange}
                required
                maxLength={16}
                style={styles.input}
                placeholder="16 digit nomor KTP"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <h2 style={styles.sectionTitle}>Detail Reservasi</h2>

            <div style={styles.formGroup}>
              <label style={styles.label}>Pilih Tipe Kost *</label>
              <select
                name="kost_id"
                value={formData.kost_id}
                onChange={handleChange}
                required
                style={styles.select}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                {kostOptions.map((kost: any) => (
                  <option key={kost.id} value={kost.id}>
                    {kost.nama} - {formatCurrency(kost.harga)} / Tahun
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Tanggal Mulai Sewa *</label>
              <input
                type="date"
                name="tanggal_mulai"
                value={formData.tanggal_mulai}
                onChange={handleChange}
                required
                style={styles.input}
                min={new Date().toISOString().split('T')[0]}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Durasi Sewa *</label>
              <select
                name="durasi"
                value={formData.durasi}
                onChange={handleChange}
                required
                style={styles.select}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <option value="1">1 Bulan</option>
                <option value="3">3 Bulan</option>
                <option value="6">6 Bulan</option>
                <option value="12">12 Bulan (1 Tahun)</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Catatan Tambahan</label>
              <textarea
                name="catatan"
                value={formData.catatan}
                onChange={handleChange}
                rows={4}
                style={styles.textarea}
                placeholder="Tambahkan catatan atau permintaan khusus (opsional)"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <button 
              type="submit" 
              style={styles.submitButton}
              disabled={loading}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {loading ? '⏳ Memproses...' : '📝 Kirim Reservasi'}
            </button>

            <p style={styles.note}>
              * Setelah submit, tim kami akan menghubungi Anda dalam 1x24 jam untuk konfirmasi dan proses pembayaran.
            </p>
          </form>

          <div style={{
            ...styles.sidebar,
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateX(0)' : 'translateX(30px)',
            transition: 'all 0.8s ease-out 0.5s',
          }}>
            <div style={styles.summaryCard}>
              <h3 style={styles.summaryTitle}>Ringkasan Reservasi</h3>
              
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Tipe Kost:</span>
                <span style={styles.summaryValue}>{selectedKost?.nama}</span>
              </div>

              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Harga:</span>
                <span style={styles.summaryValue}>{selectedKost ? formatCurrency(selectedKost.harga) : '-'}</span>
              </div>

              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Durasi:</span>
                <span style={styles.summaryValue}>{formData.durasi} Bulan</span>
              </div>

              {formData.tanggal_mulai && (
                <div style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>Tanggal Mulai:</span>
                  <span style={styles.summaryValue}>
                    {new Date(formData.tanggal_mulai).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}

              <div style={styles.divider}></div>

              <div style={styles.totalSection}>
                <span style={styles.totalLabel}>Total Estimasi:</span>
                <span style={styles.totalValue}>{formatCurrency(calculateTotal())}</span>
              </div>

              <p style={styles.summaryNote}>
                💡 Harga sudah termasuk listrik, air, dan WiFi
              </p>
            </div>

            <div style={styles.infoCard}>
              <h4 style={styles.infoTitle}>📋 Dokumen yang Diperlukan</h4>
              <ul style={styles.infoList}>
                <li>Fotocopy KTP</li>
                <li>Pas Foto 3x4 (2 lembar)</li>
                <li>Surat Keterangan Kerja/Kuliah</li>
                <li>Deposit keamanan (akan dikembalikan)</li>
              </ul>
            </div>

            <div style={styles.helpCard}>
              <h4 style={styles.helpTitle}>🤝 Butuh Bantuan?</h4>
              <p style={styles.helpText}>
                Hubungi kami melalui WhatsApp untuk pertanyaan atau survey lokasi
              </p>
              <a 
                href="https://api.whatsapp.com/send?phone=6283878515387&text=Halo,%20saya%20tertarik%20dengan%20Kost%20Pondok%20Qonitaat" 
                target="_blank"
                rel="noopener noreferrer"
                style={styles.whatsappButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                💬 Chat WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom, #f8fafc 0%, #e2e8f0 100%)',
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '3rem 2rem',
    textAlign: 'center',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1.1rem',
    opacity: 0.95,
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '3rem 2rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '2rem',
  },
  form: {
    background: 'white',
    padding: '2.5rem',
    borderRadius: '15px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '1.5rem',
    marginTop: '1.5rem',
    paddingBottom: '0.75rem',
    borderBottom: '2px solid #e2e8f0',
  },
  formGroup: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '0.5rem',
  },
  input: {
    width: '100%',
    padding: '0.875rem',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '0.875rem',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    backgroundColor: 'white',
    transition: 'all 0.3s ease',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '0.875rem',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '1rem',
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
    outline: 'none',
  },
  submitButton: {
    width: '100%',
    padding: '1rem',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  note: {
    fontSize: '0.85rem',
    color: '#64748b',
    marginTop: '1rem',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  summaryCard: {
    background: 'white',
    padding: '2rem',
    borderRadius: '15px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
  },
  summaryTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '1.5rem',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1rem',
    fontSize: '0.95rem',
  },
  summaryLabel: {
    color: '#64748b',
  },
  summaryValue: {
    color: '#1e293b',
    fontWeight: 600,
  },
  divider: {
    height: '1px',
    background: '#e2e8f0',
    margin: '1.5rem 0',
  },
  totalSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#10b981',
  },
  summaryNote: {
    fontSize: '0.85rem',
    color: '#64748b',
    marginTop: '1rem',
    fontStyle: 'italic',
  },
  infoCard: {
    background: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  infoTitle: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '1rem',
  },
  infoList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    fontSize: '0.9rem',
    color: '#64748b',
  },
  helpCard: {
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    padding: '1.5rem',
    borderRadius: '12px',
    color: 'white',
  },
  helpTitle: {
    fontSize: '1rem',
    fontWeight: 'bold',
    marginBottom: '0.75rem',
  },
  helpText: {
    fontSize: '0.9rem',
    marginBottom: '1rem',
    opacity: 0.95,
  },
  whatsappButton: {
    display: 'block',
    padding: '0.75rem',
    background: 'white',
    color: '#f97316',
    textDecoration: 'none',
    borderRadius: '8px',
    textAlign: 'center',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  successCard: {
    maxWidth: '600px',
    margin: '6rem auto',
    background: 'white',
    padding: '4rem 3rem',
    borderRadius: '20px',
    textAlign: 'center',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  },
  successIcon: {
    width: '100px',
    height: '100px',
    margin: '0 auto 2rem',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '4rem',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '1rem',
  },
  successText: {
    fontSize: '1.1rem',
    color: '#64748b',
    marginBottom: '1rem',
    lineHeight: 1.6,
  },
  successSubtext: {
    fontSize: '0.95rem',
    color: '#94a3b8',
    fontStyle: 'italic',
  },
};