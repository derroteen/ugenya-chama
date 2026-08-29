import Link from "next/link";

const bylaws: Array<{ number: number; text: string; subitems?: string[] }> = [
  { number: 1, text: "Member manyien nodonj kod; registration kshs.100, sengo kshs1200.00, emergency kshs.600" },
  {
    number: 2,
    text: "Sengo mar dwe ka dwe nobed kshs.100.00.",
    subitems: [
      "10% dhi e tije mag bura..",
      "90% nodong' kaka sengo mar jabura, nolok kode mondo okel ohala(dividends),ohala manokel nopoge kaluwre kod sengo mar member e higa ka higa.",
      "Ka member oweyo bura iduoko ne pesane mar dongruok kuom ndalo apar ga ang'wen chakre chieng' mondike barua mar weyo bura.",
      "Ka member otho to iduokone pesane mar dongruok kuom ndalo abiriyo",
      "Member ma podi ok osengo ei dweche ang'wen nowe bet jakanyo",
    ],
  },
  { number: 3, text: "Ukaguzi notim kod pesa mar ;emergency ,sengo mar dwe ka dwe ,liete apar mogik." },
  { number: 4, text: "Member ka member nyaka bed kod emergency kendo list mar emergency kod mar sengo nyaka kel dwe ka dwe e committy.." },
  { number: 5, text: "Member nobed kod thuolo mar dwe achiel mar duoko emergency ka osetiyo." },
  { number: 6, text: "Member manobed maonge kod pesa mar emergency man piny mar kshs.600 ok nikaw ting' mare." },
  { number: 7, text: "Repode duto mag bura nokal kuom branch ofis to head ofis." },
  { number: 8, text: "Harambee mag liel nochakre saa apar gariyo nyaka saa adek modhiambo." },
  { number: 9, text: "Buche mag komiti magalamoro nochakre saa aboro e wang'e nyaka saa apar ga achiel odhiambo." },
  { number: 10, text: "Lewo saa mar komiti en kshs.20.fine" },
  { number: 11, text: "Lewo chuth en kshs. 50.kuom member ma ok ochopo e comiti." },
  { number: 12, text: "Onge member moyiene donjo e bura ka omer ." },
  { number: 13, text: "Pesa mar liel nobed kshs.300.member ka member." },
  { number: 14, text: "Barua mar wendo nondik gi member ni branch ,branch nondik barua ni head ofis baruano bedo renewed bang' dweche adek." },
  { number: 15, text: "Kuom ting'o nying ugenya malo members no tuang' uniform mondik ni ugenya association ." },
  { number: 16, text: "Retired chairman nokaw ting mare kachakre jakom mane otiyo higa mar 2004 nyaka sani kendo bura nogol kshs.30,000 e chenro mar yiko ka en joutene to nigol kshs.20,000.ofis maduong' nochop e yik .mano nitimre kuom jakom ma osedhi dal." },
  { number: 17, text: "Member ma dweche ang'wen nowe oko kapodi ok osengo ok nobed jabura." },
  { number: 18, text: "Recorgnition certificate nomi officials motiyo bang' higni adek mitimoe election." },
  { number: 19, text: ".Bura nokony jakanyo motho edala mana kaka ikonyo motho e town." },
  { number: 20, text: "Bura nokaw ting' mar nyath kotho kachakore ja higni adek nyaka apar gabiryo ja higni apar gaboro gi mbele nokony ka nitie barua mar college/school/hospital.." },
  { number: 21, text: "Nyithindo man piny mar higni adek nokaw ting' margi kod branch mare." },
  { number: 22, text: "Jokanyo nogol kshs.300 .ka tho oyudore ." },
  { number: 23, text: "Ukaguzi notim kod branch kaluwre kod wuodh jakanyo, kanigi puodhe nigi ndik barua ni head office kuom seche piero ariyo ga ng'wen mondo head office bende otim ukaguzi margi." },
  { number: 24, text: "Jokanyo duto modonjo e bura nyaka bedi kod card manyiso wuodhe gi bura eyor sengo, dongruok,kod thoye." },
  { number: 25, text: "Branch manochok pesa mar liel to lewo go maok otero e harrambe bura nokaw nigi okang mager mar fine kshs.3000.00.'." },
  { number: 26, text: "Office maduong' nochung' ni yiero duto mag branches." },
  { number: 27, text: "Bad buche duto nyaka bed kod romo margi giko dwe kadwe." },
  { number: 28, text: "Pesa mar liel nochiw modong' elwedo duto bang' timo budget gi head offis kajiduto neno kuom joma odhi ewuodhno ." },
  { number: 29, text: "Jakanyo kotho bura nochumortuary bill marndalo abiryo, hospital bill ma ok okalo kshs.20,000. Sandukmar kshs.15,000. Kod mutoka matero ringre kadala kshs.16,000.branch request kshs.9000.00." },
  { number: 30, text: "Janyuol jabura mokel chiedho nokaw ting'ne ka otho maonge condition ka otimre e aluora mar uasin gishu county ." },
  { number: 31, text: "Wendo mobiro dak kod member ka ngima nyaka ndik barua ." },
  { number: 32, text: "Wendo ma ibiro chiedho nyaka tiek dwe achiel eka inyalo puodhe." },
  { number: 33, text: "Wendo manobed reffered ok nikaw ting mare" },
  { number: 34, text: "Member ka notho nyaka 2/3 branch members nodhi e yik mare." },
  { number: 35, text: "Chairman kotho ka en etich to chairmen duto no chop e yik mare." },
  { number: 36, text: "Ka bura nobed kod function moro amora members duto nobed e uniform." },
];

export default function MemberBylawsPage() {
  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Ugenya Association Eldoret</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
          By-Laws
        </h1>

        <ol className="mt-8 space-y-5">
          {bylaws.map((item) => (
            <li key={item.number} className="flex gap-3">
              <span className="flex-none font-semibold text-[#1d3a8a]">{item.number}.</span>
              <div>
                <p className="text-base leading-7">{item.text}</p>
                {item.subitems ? (
                  <ol className="mt-2 space-y-2 pl-1" style={{ listStyleType: "lower-alpha" }}>
                    {item.subitems.map((sub, index) => (
                      <li key={index} className="ml-5 text-base leading-7">
                        {sub}
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 border-t border-slate-100 pt-6">
          <Link
            href="/member"
            className="inline-flex items-center justify-center rounded-lg border border-[#1d3a8a]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#0f1729] transition hover:border-[#1d3a8a]/35 hover:bg-slate-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
