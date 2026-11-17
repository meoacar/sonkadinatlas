import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SignMeta {
    sign: string;
    nameTr: string;
    element: string;
    luckyColor: string;
    luckyStone: string;
    luckyNumber: number;
    themeDaily: string;
    loveDaily: string;
    careerDaily: string;
    healthDaily: string;
    affirmation: string;
    weeklyFocus: string;
    monthlyFocus: string;
    scores: { love: number; career: number; health: number; energy: number };
}

const SIGNS_DATA: SignMeta[] = [
    {
        sign: 'aries',
        nameTr: 'Koç',
        element: 'Ateş',
        luckyColor: 'Mercan Kırmızısı',
        luckyStone: 'Karnelyan',
        luckyNumber: 9,
        themeDaily: 'Cesur Adımlar ve Taze Motivasyon',
        loveDaily: 'İlişkinizde açık iletişim kurmak yanlış anlaşılmaları hızla çözer. Spontane küçük bir jest bağınızı güçlendirecek.',
        careerDaily: 'Ertelediğiniz bir projeyi başlatmak için yüksek odaklanma yakalıyorsunuz. Hızlı karar alırken detayları kontrol edin.',
        healthDaily: 'Yüksek fiziksel enerjinizi tempolu yürüyüş veya kısa kardiyo ile dengeleyin; bol su içmeyi ihmal etmeyin.',
        affirmation: 'Cesaretimle yeni başlangıçları sevgiyle kucaklıyorum.',
        weeklyFocus: 'Bu hafta liderlik yönünüz ön planda; haftanın ortasında iş birliğine açık olmak beklediğiniz desteği getirecek.',
        monthlyFocus: 'Bu ay kişisel hedeflerinizi sadeleştirip en önemli iki konuya odaklanmak büyük sıçrama yaratacak.',
        scores: { love: 4, career: 5, health: 4, energy: 89 },
    },
    {
        sign: 'taurus',
        nameTr: 'Boğa',
        element: 'Toprak',
        luckyColor: 'Zümrüt Yeşili',
        luckyStone: 'Pembe Kuvars',
        luckyNumber: 6,
        themeDaily: 'Huzur, Topraklanma ve Keyifli Rutinler',
        loveDaily: 'Güven ve şefkat ön planda. Partnerinizle sakin bir akşam sohbeti ya da sevdiğiniz bir lezzet paylaşımı iyi gelecek.',
        careerDaily: 'Maddi planlama ve bütçe gözden geçirmek için verimli bir gün. Sabırlı yaklaşımınız kazanç getiriyor.',
        healthDaily: 'Boyun ve omuz bölgenizi rahatlatan esneme hareketleri ve ılık bitki çayları bedeninizi dinlendirecek.',
        affirmation: 'Hayatımdaki huzuru, bereketi ve kendi ritmimi onurlandırıyorum.',
        weeklyFocus: 'Hafta boyunca finansal düzenlemeler ve ev konforunu artıran küçük dokunuşlar ruhunuza iyi gelecek.',
        monthlyFocus: 'Bu ay öz değer duygunuzu güçlendiren kalıcı alışkanlıklar oluşturmak için harika bir zemin sunuyor.',
        scores: { love: 5, career: 4, health: 4, energy: 80 },
    },
    {
        sign: 'gemini',
        nameTr: 'İkizler',
        element: 'Hava',
        luckyColor: 'Açık Sarı',
        luckyStone: 'Sitrin',
        luckyNumber: 5,
        themeDaily: 'Parlak Fikirler ve Akıcı İletişim',
        loveDaily: 'Flörtöz ve keyifli sohbetler gündemde. Merakla dinlemek karşınızdakine kendini özel hissettirecek.',
        careerDaily: 'E-postalar, sunumlar ve yeni fikir alışverişleri hız kazanıyor. Not defterinizi yanınızda bulundurun.',
        healthDaily: 'Zihinsel yoğunluğu azaltmak için akşam ekran süresini sınırlayıp derin nefes egzersizi yapın.',
        affirmation: 'Zihnim berrak, kelimelerim nazik ve ilham verici.',
        weeklyFocus: 'Kısa seyahatler, eğitimler veya yakın çevreyle yoğun haberleşme haftaya renk katacak.',
        monthlyFocus: 'Bu ay öğrendiğiniz yeni bilgileri pratiğe dökmek hem sosyal hem profesyonel çevrenizi genişletecek.',
        scores: { love: 4, career: 5, health: 3, energy: 84 },
    },
    {
        sign: 'cancer',
        nameTr: 'Yengeç',
        element: 'Su',
        luckyColor: 'İnci Beyazı',
        luckyStone: 'Ay Taşı',
        luckyNumber: 2,
        themeDaily: 'Sezgisel Güç ve Duygusal Şefkat',
        loveDaily: 'Duygusal derinliğiniz artıyor. İç sesinize kulak verip sevdiklerinizle samimi duygularınızı paylaşabilirsiniz.',
        careerDaily: 'Sezgileriniz ekip içi dinamikleri doğru okumanızı sağlıyor. Koruyucu sınırlar koymayı unutmayın.',
        healthDaily: 'Sıvı tüketimi ve kaliteli uyku bugün ekstra önemli; kendinize yumuşak, dinlendirici bir akşam ayırın.',
        affirmation: 'Duygularıma güveniyorum ve kendime şefkatle alan açıyorum.',
        weeklyFocus: 'Aile ve ev yaşamında uyum yakalayacağınız, geçmişten gelen bir konunun tatlıya bağlanacağı bir hafta.',
        monthlyFocus: 'Ay döngüsüyle paralel ilerleyen içsel farkındalığınız bu ay önemli duygusal yenilenmeler getiriyor.',
        scores: { love: 5, career: 3, health: 4, energy: 78 },
    },
    {
        sign: 'leo',
        nameTr: 'Aslan',
        element: 'Ateş',
        luckyColor: 'Altın Kehribar',
        luckyStone: 'Güneş Taşı',
        luckyNumber: 1,
        themeDaily: 'Işıltılı Özgüven ve Yaratıcı İfade',
        loveDaily: 'Romantizm ve neşe yükseliyor! Kalbinizden geldiği gibi cömert davranmak ilişkide sıcaklığı artıracak.',
        careerDaily: 'Görünürlüğünüz artıyor; yaratıcı fikirlerinizi sunmaktan çekinmeyin, takdir toplayacaksınız.',
        healthDaily: 'Enerjiniz yüksek; dans, pilates veya kalp ritmini destekleyen keyifli bir aktivite harika hissettirecek.',
        affirmation: 'Doğal ışığımı güvenle ve neşeyle paylaşıyorum.',
        weeklyFocus: 'Yaratıcı projeler ve sosyal davetler açısından haftanın en parlak burçlarından birisiniz.',
        monthlyFocus: 'Bu ay sahne sizin; özgüvenle attığınız adımlar uzun süredir beklediğiniz fırsatların kapısını aralayacak.',
        scores: { love: 5, career: 5, health: 4, energy: 92 },
    },
    {
        sign: 'virgo',
        nameTr: 'Başak',
        element: 'Toprak',
        luckyColor: 'Adaçayı Yeşili',
        luckyStone: 'Amazonit',
        luckyNumber: 4,
        themeDaily: 'Zarif Düzen ve Beden-Zihin Dengesi',
        loveDaily: 'Küçük ama anlamlı özen göstergeleri büyük sözlerden daha etkili olacak. Mükemmeliyetçiliği biraz gevşetin.',
        careerDaily: 'Detay gerektiren işlerde harikasınız. Planlı ilerleyerek haftalık yükünüzü şimdiden hafifletebilirsiniz.',
        healthDaily: 'Sindirim sisteminizi destekleyen hafif öğünler ve düzenli su tüketimi gün boyu dinç tutacak.',
        affirmation: 'Kendime karşı nazikim; attığım her küçük adım yeterli ve değerli.',
        weeklyFocus: 'Günlük rutinleri ve çalışma alanını düzenlemek zihninizdeki tüm dağınıklığı temizleyecek.',
        monthlyFocus: 'Bu ay sağlık, beslenme ve kişisel verimlilik konularında yılın en düzenli dönemlerinden birine giriyorsunuz.',
        scores: { love: 4, career: 5, health: 5, energy: 83 },
    },
    {
        sign: 'libra',
        nameTr: 'Terazi',
        element: 'Hava',
        luckyColor: 'Pudra Pembe',
        luckyStone: 'Lapis Lazuli',
        luckyNumber: 7,
        themeDaily: 'Estetik Uyum ve Zarif Denge',
        loveDaily: 'İlişkilerde uyum ve romantizm çok yüksek. Karşılıklı anlayış ve zarif bir jest günü unutulmaz kılabilir.',
        careerDaily: 'Ortaklıklar ve uzlaşma gerektiren görüşmelerde diplomasi gücünüzle öne çıkıyorsunuz.',
        healthDaily: 'Bel ve duruş sağlığınıza özen gösterin; sevdiğiniz bir müzik eşliğinde hafif yoga ruhunuzu dengeleyecek.',
        affirmation: 'Hayatımın her alanında zarafet, adalet ve içsel denge yaratıyorum.',
        weeklyFocus: 'Sanat, bakım ve yakın ilişkilerde uyum arayışınız hafta boyunca güzel tesadüflerle destekleniyor.',
        monthlyFocus: 'İkili ilişkilerde yeni bir sayfa açabilir veya mevcut bağlarınızı daha sağlam bir dengeye oturtabilirsiniz.',
        scores: { love: 5, career: 4, health: 4, energy: 85 },
    },
    {
        sign: 'scorpio',
        nameTr: 'Akrep',
        element: 'Su',
        luckyColor: 'Bordo Mürdüm',
        luckyStone: 'Obsidyen',
        luckyNumber: 8,
        themeDaily: 'Derin Dönüşüm ve Güçlü Odak',
        loveDaily: 'Tutku ve samimiyet yoğunlaşıyor. Yüzeysel sohbetler yerine gerçek duygulara dokunan paylaşımlar sizi besleyecek.',
        careerDaily: 'Araştırma, strateji ve gizli detayları görme konusunda eşsiz bir keskinliğe sahipsiniz.',
        healthDaily: 'Stresi bedeninizde biriktirmemek için akşam saatlerinde sıcak duş ve meditasyonla arının.',
        affirmation: 'Değişime güveniyor, içsel gücümden ilham alıyorum.',
        weeklyFocus: 'Artık size hizmet etmeyen alışkanlıkları geride bırakıp yenilenmeye odaklanacağınız güçlü bir hafta.',
        monthlyFocus: 'Bu ay derin kararlar ve finansal/duygusal dönüşümlerle çok daha güçlü bir versiyonunuza adım atıyorsunuz.',
        scores: { love: 5, career: 4, health: 4, energy: 86 },
    },
    {
        sign: 'sagittarius',
        nameTr: 'Yay',
        element: 'Ateş',
        luckyColor: 'Mor Eflatun',
        luckyStone: 'Turkuaz',
        luckyNumber: 3,
        themeDaily: 'Özgür Ufuklar ve İyimser Enerji',
        loveDaily: 'Ortak hayaller ve eğlenceli planlar ilişkinize tazelik getiriyor. Yeni bir keşif fikri kalbinizi ısıtacak.',
        careerDaily: 'Büyük resmi görme yeteneğiniz yüksek; yeni eğitim, seyahat veya vizyoner projeler gündeme gelebilir.',
        healthDaily: 'Açık havada tempolu yürüyüş ve bacak esnetme hareketleri enerjinizi harika şekilde tazeleyecek.',
        affirmation: 'Hayatın bana sunduğu yeni ufuklara neşeyle açılıyorum.',
        weeklyFocus: 'Rutinlerin dışına çıkmak, ilham verici kitaplar veya sohbetlerle ufkunuzu genişletmek size çok iyi gelecek.',
        monthlyFocus: 'Bu ay iyimserliğiniz çevrenize de bulaşıyor; yeni maceralar ve hedefler için güçlü rüzgar arkanızda.',
        scores: { love: 4, career: 4, health: 5, energy: 90 },
    },
    {
        sign: 'capricorn',
        nameTr: 'Oğlak',
        element: 'Toprak',
        luckyColor: 'Gece Laciverti',
        luckyStone: 'Oniks',
        luckyNumber: 10,
        themeDaily: 'Kararlı Adımlar ve Sağlam Başarı',
        loveDaily: 'Sözünüzün arkasında durmanız ve güven veren tavrınız partnerinizin gözünde çok kıymetli. Duygularınızı göstermekten çekinmeyin.',
        careerDaily: 'Uzun vadeli hedefler için somut ilerleme kaydedeceğiniz bir gün. Disiplininiz meyvesini veriyor.',
        healthDaily: 'Diz, eklem sağlığı ve düzenli dinlenme molalarına dikkat edin; kendinize dinlenmeyi de görev listesi gibi hediye edin.',
        affirmation: 'Adımlarım sağlam, emeğim bereketli ve iç dünyam huzurlu.',
        weeklyFocus: 'Kariyer ve sorumluluklarda önemli bir kilometre taşını tamamlayıp hafta sonu rahat bir nefes alacaksınız.',
        monthlyFocus: 'Bu ay sabırla inşa ettiğiniz projelerin somut sonuçlarını ve hak ettiğiniz takdiri alma zamanı.',
        scores: { love: 4, career: 5, health: 4, energy: 81 },
    },
    {
        sign: 'aquarius',
        nameTr: 'Kova',
        element: 'Hava',
        luckyColor: 'Elektrik Mavisi',
        luckyStone: 'Ametist',
        luckyNumber: 11,
        themeDaily: 'Özgün Fikirler ve Sosyal İlham',
        loveDaily: 'Zihinsel uyum ve arkadaşça yaklaşım kalbinizi açıyor. Sıra dışı bir buluşma fikri günü renklendirebilir.',
        careerDaily: 'Alışılmışın dışındaki çözümleriniz ekip içinde fark yaratıyor. Teknoloji ve topluluk işleri için ideal gün.',
        healthDaily: 'Ayak bilekleri ve dolaşım için kısa esnemeler yapın; zihinsel yorgunluğa karşı temiz hava alın.',
        affirmation: 'Özgünlüğümü seviyorum ve dünyaya kendi rengimi katıyorum.',
        weeklyFocus: 'Arkadaş çevresi ve topluluk projelerinden ilham verici haberler alacağınız dinamik bir hafta.',
        monthlyFocus: 'Bu ay gelecek planlarınızı yenileyip hayallerinizi gerçeğe dönüştürecek yaratıcı bağlantılar kuruyorsunuz.',
        scores: { love: 4, career: 5, health: 4, energy: 87 },
    },
    {
        sign: 'pisces',
        nameTr: 'Balık',
        element: 'Su',
        luckyColor: 'Deniz Köpüğü',
        luckyStone: 'Akuamarin',
        luckyNumber: 12,
        themeDaily: 'Yaratıcı Akış ve Ruhsal Şifa',
        loveDaily: 'Romantizm, empati ve nazik dokunuşlar bugün çok güçlü. Sezgileriniz sevdiğiniz kişinin ihtiyaçlarını hemen hissedecek.',
        careerDaily: 'Sanatsal, yaratıcı ve insan odaklı işlerde harika bir ilham akışı var. Net saatler belirleyerek odağınızı koruyun.',
        healthDaily: 'Ilık su, meditasyon, aromaterapi ve yeterli uyku bugün bedeninize mucize gibi gelecek.',
        affirmation: 'Evrenin nazik akışına güveniyor, huzurla ilerliyorum.',
        weeklyFocus: 'Rüyalarınız, sezgileriniz ve sanatsal ilhamınız bu hafta yolunuzu aydınlatan güçlü bir pusula olacak.',
        monthlyFocus: 'Bu ay içsel huzuru önceliklendirmek hem yaratıcılığınızı hem de ikili ilişkilerinizi derinlemesine besleyecek.',
        scores: { love: 5, career: 4, health: 4, energy: 82 },
    },
];

export async function seedAstrology() {
    console.log('✨ Seeding astrology cosmic overview & horoscopes...');

    await prisma.cosmicOverview.upsert({
        where: { key: 'current' },
        update: {},
        create: {
            key: 'current',
            moonPhase: 'İlk Dördün',
            moonSign: 'Balık',
            cosmicTheme: 'Sezgisel Dengelenme ve Nazik Başlangıçlar',
            retrogradeNote: 'Merkür doğrudan harekette; iletişim, planlama ve kalpten sohbetler için akıcı bir gökyüzü var.',
            dailyAffirmation: 'Bedenimin ritmine kulak veriyor, bugünü huzur ve zarafetle kucaklıyorum.',
            energyIndex: 86,
            isActive: true,
        },
    });

    for (const s of SIGNS_DATA) {
        await prisma.horoscopeEntry.upsert({
            where: { sign_period: { sign: s.sign, period: 'daily' } },
            update: {},
            create: {
                sign: s.sign,
                period: 'daily',
                title: s.themeDaily,
                summary: `${s.nameTr} burcu için bugün: ${s.themeDaily}. ${s.loveDaily}`,
                loveText: s.loveDaily,
                careerText: s.careerDaily,
                healthText: s.healthDaily,
                loveScore: s.scores.love,
                careerScore: s.scores.career,
                healthScore: s.scores.health,
                energyScore: s.scores.energy,
                luckyNumber: s.luckyNumber,
                luckyColor: s.luckyColor,
                luckyStone: s.luckyStone,
                affirmation: s.affirmation,
                isActive: true,
            },
        });

        await prisma.horoscopeEntry.upsert({
            where: { sign_period: { sign: s.sign, period: 'weekly' } },
            update: {},
            create: {
                sign: s.sign,
                period: 'weekly',
                title: `${s.nameTr} Haftalık Kozmik Rehber`,
                summary: s.weeklyFocus,
                loveText: `Haftalık aşk enerjiniz dengeleniyor: ${s.loveDaily}`,
                careerText: `Hafta ortası üretkenlik zirvede: ${s.careerDaily}`,
                healthText: `Hafta sonu dinlenmeye alan açın: ${s.healthDaily}`,
                loveScore: s.scores.love,
                careerScore: s.scores.career,
                healthScore: s.scores.health,
                energyScore: Math.min(98, s.scores.energy + 3),
                luckyNumber: s.luckyNumber,
                luckyColor: s.luckyColor,
                luckyStone: s.luckyStone,
                affirmation: s.affirmation,
                isActive: true,
            },
        });

        await prisma.horoscopeEntry.upsert({
            where: { sign_period: { sign: s.sign, period: 'monthly' } },
            update: {},
            create: {
                sign: s.sign,
                period: 'monthly',
                title: `${s.nameTr} Aylık Dönüşüm ve Enerji`,
                summary: s.monthlyFocus,
                loveText: `Ay genelinde kalbinizi besleyen bağlar güçleniyor. ${s.loveDaily}`,
                careerText: `Ayın ikinci yarısında hedefleriniz netleşiyor. ${s.careerDaily}`,
                healthText: `Döngü ve beden ritminizi takip ederek enerjinizi koruyun. ${s.healthDaily}`,
                loveScore: s.scores.love,
                careerScore: s.scores.career,
                healthScore: s.scores.health,
                energyScore: Math.max(72, s.scores.energy - 2),
                luckyNumber: s.luckyNumber,
                luckyColor: s.luckyColor,
                luckyStone: s.luckyStone,
                affirmation: s.affirmation,
                isActive: true,
            },
        });
    }

    console.log('✅ Seeded CosmicOverview + 36 horoscope entries (12 signs × 3 periods).');
}

if (require.main === module) {
    seedAstrology()
        .catch((e) => {
            console.error('❌ Astrology seed failed:', e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
