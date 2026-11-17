import { PrismaClient, QuestionCategory, QuestionStatus, VoteType, ContentType } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedCommunity() {
    console.log('🌱 Seeding community Q&A data...');

    const existingQuestions = await prisma.question.count();
    if (existingQuestions > 0) {
        console.log(`ℹ️  Community already has ${existingQuestions} questions, skipping seed.`);
        return;
    }

    const users = await prisma.user.findMany({
        include: { profile: true },
        orderBy: { createdAt: 'asc' },
    });

    if (users.length === 0) {
        console.log('⚠️  No users found in DB. Please run main seed first.');
        return;
    }

    const adminUser = users.find((u) => u.email.includes('admin')) || users[0];
    const premiumUser = users.find((u) => u.email.includes('premium')) || users[Math.min(1, users.length - 1)];
    const freeUser = users.find((u) => u.email.includes('free')) || users[0];
    const memberA = users.find((u) => u.email.includes('google')) || freeUser;
    const memberB = users.find((u) => u.email.includes('apple')) || premiumUser;
    const memberC = users.find((u) => u.email === 'meofeat@gmail.com') || freeUser;

    // Ensure friendly display names / usernames on profiles
    const profileSeeds: Array<{ userId: string; firstName: string; lastName: string; username: string }> = [
        { userId: adminUser.id, firstName: 'NOVA', lastName: 'Uzman Ekibi', username: 'nova_uzman' },
        { userId: premiumUser.id, firstName: 'Zeynep', lastName: 'Demir', username: 'zeynepdemir' },
        { userId: freeUser.id, firstName: 'Elif', lastName: 'Yılmaz', username: 'elifyilmaz' },
        { userId: memberA.id, firstName: 'Ayşe', lastName: 'Kaya', username: 'aysekaya' },
        { userId: memberB.id, firstName: 'Selin', lastName: 'Arslan', username: 'selinarslan' },
    ];

    for (const p of profileSeeds) {
        const userRecord = users.find((u) => u.id === p.userId);
        if (!userRecord) continue;
        if (!userRecord.username) {
            await prisma.user.update({
                where: { id: p.userId },
                data: { username: p.username },
            }).catch(() => {});
        }
        await prisma.profile.upsert({
            where: { userId: p.userId },
            update: {
                firstName: p.firstName,
                lastName: p.lastName,
                displayName: `${p.firstName} ${p.lastName}`,
            },
            create: {
                userId: p.userId,
                displayName: `${p.firstName} ${p.lastName}`,
                firstName: p.firstName,
                lastName: p.lastName,
            },
        });
    }

    const now = Date.now();
    const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000);

    const seedQuestions = [
        {
            userId: freeUser.id,
            title: 'Regl dönemindeki alt karın kramplarını hafifletmek için ne yapıyorsunuz?',
            content:
                'Özellikle ilk 2 gün kramplarım çok yoğun oluyor. Sıcak su torbası dışında günlük rutinde işe yarayan bitki çayı, magnezyum veya hafif esneme hareketi öneriniz var mı?',
            category: QuestionCategory.MENSTRUAL_HEALTH,
            tags: ['kramp', 'regl', 'magnezyum', 'doğalçözüm'],
            isAnonymous: false,
            status: QuestionStatus.ANSWERED,
            viewCount: 184,
            isPremium: false,
            createdAt: hoursAgo(72),
            answers: [
                {
                    userId: adminUser.id,
                    content:
                        'Ilık duş ve alt karına uygulanan ısı kasları gevşetmeye yardımcı olur. Papatya veya rezene çayı, hafif yürüyüş ve kedi-inek esnemesi de kan dolaşımını destekler. Şiddetli ağrı günlük yaşamınızı kısıtlıyorsa bir kadın doğum uzmanına danışmanız önemlidir.',
                    isBestAnswer: true,
                    voteCount: 14,
                    createdAt: hoursAgo(68),
                },
                {
                    userId: premiumUser.id,
                    content:
                        'Bende regl öncesi 3 gün düzenli su tüketimini artırmak ve akşamları magnezyum glisinat almak krampları belirgin şekilde azalttı. Bir de bacakları duvara dikip 10 dakika dinlenmek çok rahatlatıyor.',
                    isBestAnswer: false,
                    voteCount: 9,
                    createdAt: hoursAgo(60),
                },
            ],
            comments: [
                { userId: memberA.id, content: 'Papatya çayı önerisini bu ay mutlaka deneyeceğim, teşekkürler!' },
            ],
        },
        {
            userId: premiumUser.id,
            title: 'Yumurtlama dönemini bazal vücut ısısı ile takip edenler nasıl sonuç alıyor?',
            content:
                'Döngüm genelde 28-30 gün sürüyor ama yumurtlama günümü daha net yakalamak istiyorum. Sabah uyanır uyanmaz ölçüm yapmak gerçekten düzenli bir grafik veriyor mu?',
            category: QuestionCategory.FERTILITY,
            tags: ['yumurtlama', 'bazalısı', 'doğurganlık'],
            isAnonymous: false,
            status: QuestionStatus.ANSWERED,
            viewCount: 142,
            isPremium: true,
            createdAt: hoursAgo(54),
            answers: [
                {
                    userId: memberB.id,
                    content:
                        'İlk 2 ay biraz alışma süreci gerektiriyor ama her sabah yataktan kalkmadan aynı saatte ölçünce yumurtlama sonrası 0.3–0.5°C artışı net görebiliyorsunuz. Takvimdeki verimli pencere ile çok uyumlu çıktı bende.',
                    isBestAnswer: true,
                    voteCount: 11,
                    createdAt: hoursAgo(49),
                },
            ],
            comments: [],
        },
        {
            userId: memberA.id,
            title: 'Hamileliğin ikinci trimesterinde gece uykusuzluğu için yastık ve uyku önerileri',
            content:
                '21. haftadayım ve son günlerde yan yatarken belim ağrımaya başladı. Gece sık uyanıyorum. Hamile yastığı kullananlar veya uyku hijyeni için önerisi olanlar paylaşabilir mi?',
            category: QuestionCategory.PREGNANCY,
            tags: ['hamilelik', 'ikincitrimester', 'uyku'],
            isAnonymous: false,
            status: QuestionStatus.ANSWERED,
            viewCount: 129,
            isPremium: false,
            createdAt: hoursAgo(44),
            answers: [
                {
                    userId: adminUser.id,
                    content:
                        'Sol yan pozisyonda yatarken dizlerin arasına ince bir yastık koymak pelvis ve bel üzerindeki baskıyı azaltır. Yatmadan 2 saat önce sıvı alımını hafif azaltmak gece uyanmalarını da düşürebilir.',
                    isBestAnswer: true,
                    voteCount: 8,
                    createdAt: hoursAgo(40),
                },
                {
                    userId: memberC.id,
                    content:
                        'U tipi hamile yastıkları hem sırtı hem karnı aynı anda desteklediği için gece dönme ihtiyacını bayağı azaltıyor.',
                    isBestAnswer: false,
                    voteCount: 5,
                    createdAt: hoursAgo(36),
                },
            ],
            comments: [],
        },
        {
            userId: memberB.id,
            title: 'PMS döneminde tatlı krizlerini dengelemek için sağlıklı atıştırmalıklar neler?',
            content:
                'Reglden 4-5 gün önce sürekli çikolata ve hamur işi isteğim artıyor. Kan şekerini zıplatmadan bu isteği bastıracak pratik tarif veya atıştırmalık önerileriniz var mı?',
            category: QuestionCategory.NUTRITION,
            tags: ['pms', 'beslenme', 'atıştırmalık'],
            isAnonymous: false,
            status: QuestionStatus.ANSWERED,
            viewCount: 165,
            isPremium: false,
            createdAt: hoursAgo(32),
            answers: [
                {
                    userId: premiumUser.id,
                    content:
                        'Bitter çikolata + badem ikilisi veya hurma içine fıstık ezmesi beni çok kurtarıyor. Hem tatlı ihtiyacını kesiyor hem de uzun süre tok tutuyor.',
                    isBestAnswer: false,
                    voteCount: 7,
                    createdAt: hoursAgo(28),
                },
            ],
            comments: [
                { userId: freeUser.id, content: 'Tarçınlı elma ve yoğurt da çok işe yarıyor!' },
            ],
        },
        {
            userId: freeUser.id,
            title: 'Luteal fazda tempolu spor yerine pilates veya yoga yapmak daha mı iyi?',
            content:
                'Döngümün son haftasında enerjim çok düşüyor. HIIT antrenmanlarında çabuk yoruluyorum, siz döngü fazlarına göre egzersiz yoğunluğunuzu nasıl ayarlıyorsunuz?',
            category: QuestionCategory.EXERCISE,
            tags: ['egzersiz', 'lutealfaz', 'pilates', 'yoga'],
            isAnonymous: false,
            status: QuestionStatus.OPEN,
            viewCount: 91,
            isPremium: false,
            createdAt: hoursAgo(20),
            answers: [],
            comments: [],
        },
        {
            userId: memberA.id,
            title: 'Regl öncesi kaygı ve duygusal dalgalanmalarla baş etmek için ne önerirsiniz?',
            content:
                'Her ayın aynı günlerinde sebepsiz bir huzursuzluk ve ağlama isteği geliyor. Nefes egzersizi ve günlük tutmak dışında sizi sakinleştiren rutinler neler?',
            category: QuestionCategory.MENTAL_HEALTH,
            tags: ['ruhsağlığı', 'pms', 'meditasyon'],
            isAnonymous: true,
            status: QuestionStatus.ANSWERED,
            viewCount: 210,
            isPremium: false,
            createdAt: hoursAgo(16),
            answers: [
                {
                    userId: adminUser.id,
                    content:
                        'Öncelikle bu durumun hormonal dalgalanmalarla bağlantılı olduğunu fark etmek çok değerli. Kafeini birkaç gün azaltmak, 4-7-8 nefes egzersizi yapmak ve takvime ruh halini not ederek döngüsel örüntüyü görmek kontrol hissini artırır.',
                    isBestAnswer: true,
                    voteCount: 16,
                    createdAt: hoursAgo(14),
                },
            ],
            comments: [],
        },
        {
            userId: memberC.id,
            title: 'Uyku düzenini düzeltmek için akşam ekran süresini azaltabilen var mı?',
            content:
                'Gece 23:00’te yatmaya çalışıyorum ama telefona bakarken saat 01:00 oluyor. Uyku kalitem düştükçe gün içinde çok halsiz hissediyorum.',
            category: QuestionCategory.SLEEP,
            tags: ['uykudüzeni', 'dinlenme', 'rutin'],
            isAnonymous: false,
            status: QuestionStatus.OPEN,
            viewCount: 64,
            isPremium: false,
            createdAt: hoursAgo(10),
            answers: [],
            comments: [],
        },
        {
            userId: adminUser.id,
            title: 'NOVA Topluluk Rehberi: Deneyimlerinizi Güvenle Paylaşın',
            content:
                'Topluluk alanında kadın sağlığı, döngü takibi, beslenme, uyku ve hamilelik deneyimlerinizi paylaşabilir; birbirinize destek olabilirsiniz. Sağlıkla ilgili acil durumlarda lütfen doktorunuza danışmayı unutmayın.',
            category: QuestionCategory.GENERAL,
            tags: ['topluluk', 'duyuru', 'rehber'],
            isAnonymous: false,
            status: QuestionStatus.ANSWERED,
            viewCount: 312,
            isPremium: true,
            createdAt: hoursAgo(96),
            answers: [
                {
                    userId: premiumUser.id,
                    content: 'Çok güzel bir paylaşım alanı olmuş, emeği geçenlere teşekkürler!',
                    isBestAnswer: false,
                    voteCount: 12,
                    createdAt: hoursAgo(90),
                },
            ],
            comments: [],
        },
        {
            userId: memberB.id,
            title: 'Demir eksikliği yorgunluğu için beslenmeye neler eklenebilir?',
            content:
                'Regl dönemlerinden sonra kendimi çok bitkin hissediyorum, doktorum demir seviyemin sınırda olduğunu söyledi. C vitamini ile birlikte hangi gıdaları tüketmek emilimi artırıyor?',
            category: QuestionCategory.NUTRITION,
            tags: ['demir', 'enerji', 'beslenme'],
            isAnonymous: false,
            status: QuestionStatus.OPEN,
            viewCount: 78,
            isPremium: false,
            createdAt: hoursAgo(6),
            answers: [],
            comments: [],
        },
        {
            userId: memberA.id,
            title: 'PMS şişkinliği ve ödem için gün içinde su içme hedefi yeterli oluyor mu?',
            content:
                'Özellikle regl haftası yaklaşırken yüzüklerim bile sıkıyor. Su takibinden 2.5 litreye çıkınca biraz rahatlıyorum ama başka nelere dikkat etmeliyim?',
            category: QuestionCategory.PMS,
            tags: ['ödem', 'şişkinlik', 'sutakibi'],
            isAnonymous: false,
            status: QuestionStatus.ANSWERED,
            viewCount: 118,
            isPremium: false,
            createdAt: hoursAgo(4),
            answers: [
                {
                    userId: freeUser.id,
                    content:
                        'Tuzu birkaç gün hafif azaltıp maydanoz-limonlu su ve bol yeşillik eklemek bende ödemi çok hızlı çözüyor.',
                    isBestAnswer: false,
                    voteCount: 4,
                    createdAt: hoursAgo(2),
                },
            ],
            comments: [],
        },
    ];

    let createdAnswerIdForReport: string | null = null;
    let createdQuestionIdForReport: string | null = null;

    for (const qData of seedQuestions) {
        const question = await prisma.question.create({
            data: {
                userId: qData.userId,
                title: qData.title,
                content: qData.content,
                category: qData.category,
                tags: qData.tags,
                isAnonymous: qData.isAnonymous,
                status: qData.status,
                viewCount: qData.viewCount,
                isPremium: qData.isPremium,
                createdAt: qData.createdAt,
            },
        });

        if (!createdQuestionIdForReport) {
            createdQuestionIdForReport = question.id;
        }

        // Favorite by 2 users so favorite counts appear
        await prisma.questionFavorite.createMany({
            data: [
                { questionId: question.id, userId: premiumUser.id },
                ...(qData.userId !== freeUser.id ? [{ questionId: question.id, userId: freeUser.id }] : []),
            ],
            skipDuplicates: true,
        });

        for (const aData of qData.answers) {
            const answer = await prisma.answer.create({
                data: {
                    questionId: question.id,
                    userId: aData.userId,
                    content: aData.content,
                    isBestAnswer: aData.isBestAnswer,
                    voteCount: aData.voteCount,
                    createdAt: aData.createdAt,
                },
            });

            if (!createdAnswerIdForReport && !aData.isBestAnswer) {
                createdAnswerIdForReport = answer.id;
            }
        }

        for (const cData of qData.comments) {
            await prisma.questionComment.create({
                data: {
                    questionId: question.id,
                    userId: cData.userId,
                    content: cData.content,
                },
            });
        }
    }

    // Seed reputation entries for contributors
    const repData = [
        { userId: adminUser.id, totalPoints: 240, questionsAsked: 1, answersGiven: 3, bestAnswers: 3, upvotesReceived: 38 },
        { userId: premiumUser.id, totalPoints: 145, questionsAsked: 1, answersGiven: 3, bestAnswers: 0, upvotesReceived: 28 },
        { userId: memberB.id, totalPoints: 110, questionsAsked: 3, answersGiven: 1, bestAnswers: 1, upvotesReceived: 11 },
        { userId: freeUser.id, totalPoints: 65, questionsAsked: 2, answersGiven: 1, bestAnswers: 0, upvotesReceived: 4 },
        { userId: memberC.id, totalPoints: 40, questionsAsked: 1, answersGiven: 1, bestAnswers: 0, upvotesReceived: 5 },
    ];

    for (const r of repData) {
        await prisma.userReputation.upsert({
            where: { userId: r.userId },
            update: {
                totalPoints: r.totalPoints,
                questionsAsked: r.questionsAsked,
                answersGiven: r.answersGiven,
                bestAnswers: r.bestAnswers,
                upvotesReceived: r.upvotesReceived,
            },
            create: r,
        });
    }

    // Create 1 sample pending moderation report so admin moderation queue is testable
    if (createdQuestionIdForReport) {
        await prisma.contentReport.create({
            data: {
                reporterId: memberA.id,
                contentType: ContentType.QUESTION,
                contentId: createdQuestionIdForReport,
                reason: 'Tıbbi doğrulama kontrolü',
                description: 'Önerilen takviye dozajları için uzman notu eklenip eklenemeyeceği kontrol edilebilir.',
                status: 'PENDING',
            },
        });
    }

    console.log(`✅ Seeded ${seedQuestions.length} community questions, answers, reputations, and moderation sample.`);
}

if (require.main === module) {
    seedCommunity()
        .catch((e) => {
            console.error('❌ Community seed failed:', e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
