/* Aurora-LAB — USACodex: phần học thêm cho từng bài.
 *  try  : “Thử ngay” — hoạt động có hướng dẫn với chính mô phỏng của bài.
 *  myth : “Hiểu lầm thường gặp” — điều hay nghĩ sai và giải thích đúng.
 *  deep : “Tìm hiểu chuyên sâu” — kiến thức chi tiết, chia mục, mỗi mục ghi nguồn (khóa trong AL.DATA.refs).
 * Chỉ ghi những điều đã được kiểm chứng trong tài liệu đã dẫn. Công thức viết bằng LaTeX ($...$),
 * dùng String.raw để giữ nguyên dấu \ . */
(function () {
  'use strict';
  const R = String.raw;
  window.AL = window.AL || {};
  window.AL.CODEX_DEEP = {

    // 1 — Bước sóng, màu sắc và năng lượng photon
    wave: {
      try: [
        'Bấm “Hβ 486,1” rồi “Hα 656,3”: sóng nào “dày” hơn, thanh năng lượng $E$ bên phải cao hơn ở sóng nào?',
        'Bấm “UV 250” và “IR 1000”: hai bước sóng này nằm ngoài vùng mắt thấy, nhưng năng lượng photon khác nhau thế nào?',
        'Bật “Sóng điện từ 3D”, kéo để xoay: điện trường $\\vec E$ và từ trường $\\vec B$ có vuông góc nhau không?',
      ],
      myth: {
        wrong: 'Màu đỏ là màu “nóng”, nên ánh sáng đỏ mang nhiều năng lượng hơn ánh sáng xanh.',
        right: 'Ngược lại: mỗi photon đỏ mang ít năng lượng hơn photon xanh, tím. Trong thiên văn, sao càng nóng càng ngả màu xanh trắng, sao nguội hơn mới có màu đỏ cam. “Đỏ là nóng” chỉ là quy ước trong hội họa và đời sống.',
        refs: ['astro2e'],
      },
      deep: [
        { h: 'Ánh sáng là sóng điện từ', refs: ['griffiths', 'upv3'],
          p: [
            R`Năm 1865, James Clerk Maxwell chỉ ra rằng điện trường và từ trường biến thiên có thể “nuôi” lẫn nhau và lan đi thành sóng. Tốc độ tính ra đúng bằng tốc độ ánh sáng đã đo được, nên ông kết luận ánh sáng chính là một loại sóng điện từ. Khoảng năm 1887–1888, Heinrich Hertz tạo ra và phát hiện được sóng điện từ trong phòng thí nghiệm, xác nhận dự đoán này.`,
            R`Trong chân không, mọi sóng điện từ đi với cùng một tốc độ $c = 299\,792\,458\ \mathrm{m/s}$ (con số chính xác tuyệt đối, vì mét được định nghĩa dựa trên nó). Bước sóng $\lambda$ và tần số $f$ liên hệ qua $c = \lambda f$: bước sóng càng ngắn thì tần số càng lớn.`,
          ] },
        { h: 'Photon: “gói” năng lượng ánh sáng', refs: ['upv3', 'codata'],
          p: [
            R`Năm 1900, Max Planck phải giả định năng lượng ánh sáng được trao đổi theo từng phần nhỏ $E = hf$ để giải thích bức xạ của vật nóng. Năm 1905, Albert Einstein đi xa hơn: ánh sáng thực sự gồm các hạt năng lượng, nay gọi là photon, và dùng ý tưởng đó giải thích hiệu ứng quang điện.`,
            R`Kết hợp hai hệ thức trên: $E = hf = \dfrac{hc}{\lambda}$. Với $hc \approx 1239{,}84\ \mathrm{eV\cdot nm}$, ta có cách tính nhanh $E\,(\mathrm{eV}) \approx \dfrac{1240}{\lambda\,(\mathrm{nm})}$. Ví dụ, photon xanh lục 557,7 nm của cực quang mang $E \approx \dfrac{1240}{557{,}7} \approx 2{,}22\ \mathrm{eV}$.`,
          ] },
        { h: 'Mắt người “đọc” màu như thế nào?', refs: ['cie'],
          p: [
            'Võng mạc có ba loại tế bào nón, mỗi loại nhạy nhất với một vùng bước sóng (ngắn, trung bình, dài). Não so sánh tín hiệu của ba loại này để tạo cảm giác màu. Vì thế, màu là cách não diễn giải bước sóng, chứ bản thân bước sóng không “có màu”.',
            'Ban ngày, mắt nhạy nhất với ánh sáng khoảng 555 nm (xanh lục ngả vàng); trong bóng tối, khi chủ yếu tế bào que làm việc, điểm nhạy nhất dịch về khoảng 507 nm. Khoảng 380–780 nm là quy ước thường dùng; ở hai đầu, độ nhạy của mắt giảm rất mạnh.',
          ] },
        { h: 'Bên ngoài vùng nhìn thấy', refs: ['astro2e'],
          p: [
            'Ánh sáng nhìn thấy chỉ là một khoảng rất hẹp trong phổ điện từ. Đi về phía bước sóng dài có hồng ngoại, vi sóng, sóng vô tuyến; đi về phía bước sóng ngắn có tử ngoại, tia X và tia gamma.',
            'Khí quyển chặn phần lớn tia gamma, tia X và tử ngoại (tầng ozone hấp thụ mạnh tử ngoại có bước sóng dưới khoảng 300 nm). Vì vậy, muốn quan sát vũ trụ ở các vùng này, các nhà thiên văn phải đưa kính thiên văn lên không gian.',
          ] },
      ],
    },

    // 2 — Năng lượng bị lượng tử hóa
    absorb: {
      try: [
        'Bấm “600,0 nm”: photon có bị hấp thụ không? Vì sao?',
        'Bấm lần lượt 656,3 · 486,1 · 434,0 · 410,2 nm và để ý electron nhảy lên những mức nào.',
        'Kéo chậm thanh trượt quanh 656 nm: chỉ lệch một chút khỏi 656,3 nm thì điều gì xảy ra?',
      ],
      myth: {
        wrong: 'Nguyên tử nhận photon có năng lượng lớn hơn ΔE, dùng phần cần thiết và “giữ lại” phần dư.',
        right: 'Với chuyển mức giữa hai mức năng lượng, nguyên tử chỉ nhận photon có năng lượng đúng bằng ΔE (trong một khoảng rất hẹp). Trường hợp khác duy nhất là khi photon đủ mạnh để bứt hẳn electron ra khỏi nguyên tử (ion hóa): khi đó phần năng lượng dư biến thành động năng của electron bay ra.',
        refs: ['upv3'],
      },
      deep: [
        { h: 'Mô hình Bohr và công thức của hydrogen', refs: ['bohr', 'upv3'],
          p: [
            R`Năm 1913, Niels Bohr đề xuất rằng electron trong nguyên tử hydrogen chỉ có thể ở những mức năng lượng nhất định: $E_n = -\dfrac{13{,}6\ \mathrm{eV}}{n^2}$ với $n = 1, 2, 3, \dots$ Dấu trừ nghĩa là electron bị hạt nhân “giữ lại”; muốn kéo nó ra xa vô cùng phải tốn năng lượng.`,
            'Mô hình Bohr giải thích chính xác quang phổ của hydrogen nhưng thất bại với nguyên tử nhiều electron. Cơ học lượng tử ra đời sau đó (từ năm 1925–1926) mô tả đúng mọi nguyên tử, và với hydrogen vẫn cho ra cùng công thức năng lượng trên.',
          ] },
        { h: 'Công thức Rydberg: tính mọi vạch của hydrogen', refs: ['upv3', 'codata'],
          p: [
            R`Từ công thức năng lượng, bước sóng của photon khi electron chuyển giữa mức $n_2$ và $n_1$ ($n_2 > n_1$) là: $$\frac{1}{\lambda} = R_\infty\left(\frac{1}{n_1^2} - \frac{1}{n_2^2}\right),\qquad R_\infty \approx 1{,}097 \times 10^{7}\ \mathrm{m^{-1}}$$`,
            R`Ví dụ với $n_1 = 2$, $n_2 = 3$: $\dfrac{1}{\lambda} = R_\infty\left(\dfrac14 - \dfrac19\right)$, cho $\lambda \approx 656\ \mathrm{nm}$, đúng vạch đỏ Hα. (Con số đo chính xác hơn có khác chút ít vì hạt nhân không đứng yên tuyệt đối và vì bước sóng trong không khí hơi ngắn hơn trong chân không.)`,
          ] },
        { h: 'Khi photon đủ mạnh để bứt electron ra', refs: ['upv3', 'nist'],
          p: [
            R`Năng lượng ion hóa của hydrogen ở trạng thái cơ bản là khoảng 13,6 eV, ứng với bước sóng $\lambda \approx \dfrac{1240}{13{,}6} \approx 91{,}2\ \mathrm{nm}$ (giới hạn Lyman). Photon có bước sóng ngắn hơn đều có thể ion hóa nguyên tử, nên phía dưới 91,2 nm hydrogen hấp thụ liên tục chứ không chỉ ở từng vạch.`,
          ] },
        { h: 'Vì sao vạch phổ không mảnh tuyệt đối?', refs: ['astro2e'],
          p: [
            'Mỗi vạch thực ra có một độ rộng nhỏ. Hai nguyên nhân phổ biến: nguyên tử chuyển động hỗn loạn do nhiệt nên ánh sáng bị lệch Doppler một chút (khí càng nóng, vạch càng rộng); và va chạm giữa các nguyên tử làm nhiễu các mức năng lượng (khí càng đặc, vạch càng rộng). Nhờ đo độ rộng vạch, các nhà thiên văn ước lượng được nhiệt độ và áp suất trong khí quyển các ngôi sao.',
          ] },
      ],
    },

    // 3 — Phát xạ photon khi electron chuyển mức
    emit: {
      try: [
        'Kéo thanh “Khoảng cách giữa hai mức ΔE” từ nhỏ đến lớn: màu photon đổi theo hướng nào?',
        'Bấm “Na 2,10 eV” rồi “N₂⁺ 2,90 eV”: tính thử $\\lambda \\approx 1240/\\Delta E$ và so với con số trên màn hình.',
        'Bấm hai nút của O (2,22 eV và 1,97 eV): đây chính là hai màu xanh lục và đỏ của cực quang.',
      ],
      myth: {
        wrong: 'Electron quay quanh hạt nhân theo quỹ đạo tròn như hành tinh quanh Mặt Trời.',
        right: 'Đó là hình ảnh của mô hình Bohr, rất hữu ích để hình dung các mức năng lượng, nhưng không đúng với thực tế. Theo cơ học lượng tử, electron không có quỹ đạo xác định; ta chỉ biết xác suất tìm thấy nó ở từng vùng quanh hạt nhân (gọi là orbital). Điều vẫn đúng là: năng lượng của electron chỉ nhận một số giá trị nhất định.',
        refs: ['chem2e'],
      },
      deep: [
        { h: 'Electron ở trạng thái kích thích được bao lâu?', refs: ['nist', 'upv3'],
          p: [
            'Với phần lớn các chuyển mức “được phép”, trạng thái kích thích chỉ tồn tại cỡ vài nano giây đến vài chục nano giây (1 ns = một phần tỉ giây) rồi phát photon. Ví dụ, mức 3p của sodium, nguồn gốc vạch vàng 589 nm, có thời gian sống khoảng 16 ns.',
            'Cơ sở dữ liệu NIST ghi cho mỗi vạch một hệ số gọi là xác suất chuyển mức (đơn vị s⁻¹), cho biết chuyển mức xảy ra nhanh hay chậm. Hệ số càng lớn, trạng thái càng nhanh phát sáng.',
          ] },
        { h: 'Quy tắc chọn lọc và vạch “cấm”', refs: ['chem2e', 'slanger'],
          p: [
            'Không phải cặp mức nào cũng dễ dàng chuyển cho nhau. Các định luật bảo toàn (đặc biệt là bảo toàn mômen động lượng, vì photon mang theo một lượng mômen động lượng) đặt ra các quy tắc chọn lọc. Chuyển mức vi phạm các quy tắc thông thường vẫn có thể xảy ra nhưng chậm hơn hàng triệu lần trở lên; vạch phát ra gọi là vạch cấm.',
            'Hai màu chính của cực quang (557,7 nm và 630,0 nm của oxygen) đều là vạch cấm: trạng thái phát ra chúng sống khoảng 0,7 s và 110 s. Trên Trái Đất ta khó thấy chúng trong phòng thí nghiệm, vì va chạm đã lấy mất năng lượng trước khi kịp phát sáng.',
          ] },
        { h: 'Phát xạ tự phát và phát xạ kích thích', refs: ['upv3'],
          p: [
            'Khi electron tự rơi xuống và phát photon theo hướng ngẫu nhiên, đó là phát xạ tự phát, như trong ngọn lửa hay cực quang. Năm 1917, Einstein chỉ ra còn một cách khác: một photon đi ngang qua có thể “kích” nguyên tử đang ở trạng thái kích thích phát ra một photon giống hệt nó (cùng bước sóng, cùng hướng, cùng pha). Hiện tượng phát xạ kích thích này là nguyên lý của laser.',
          ] },
      ],
    },

    // 4 — Các dãy phổ của hydrogen
    series: {
      try: [
        'Chọn “Balmer”: đếm số vạch rơi vào vùng nhìn thấy trên thanh phổ.',
        'Chuyển sang “Lyman” rồi “Paschen”: các vạch dịch về đâu so với vùng nhìn thấy?',
        'Trong dãy Balmer, các vạch càng về phía tím càng sát nhau. Bạn đoán chúng sẽ dừng ở đâu?',
      ],
      myth: {
        wrong: 'Hydrogen chỉ có 4 vạch phổ: đỏ, xanh lam, chàm, tím.',
        right: 'Bốn vạch đó chỉ là những vạch dễ thấy nhất của dãy Balmer. Về lý thuyết, mỗi dãy có vô số vạch, càng lúc càng sát nhau và dồn về một “giới hạn dãy”. Với dãy Balmer, giới hạn này nằm ở khoảng 365 nm, trong vùng tử ngoại gần. Ngoài ra còn các dãy Lyman (tử ngoại), Paschen, Brackett… (hồng ngoại).',
        refs: ['upv3'],
      },
      deep: [
        { h: 'Từ một công thức “đoán” đến lý thuyết', refs: ['upv3', 'bohr'],
          p: [
            'Năm 1885, Johann Balmer, một giáo viên toán, tìm ra công thức khớp với bốn vạch nhìn thấy của hydrogen dù không biết vì sao nó đúng. Johannes Rydberg tổng quát hóa công thức này vài năm sau. Theodore Lyman (tử ngoại) và Friedrich Paschen (hồng ngoại) sau đó tìm thêm các dãy mới, đúng như công thức dự đoán. Mãi đến năm 1913, mô hình Bohr mới giải thích được nguồn gốc của các công thức ấy.',
          ] },
        { h: 'Hα: màu hồng đỏ của tinh vân', refs: ['astro2e'],
          p: [
            'Quanh các ngôi sao trẻ, rất nóng, tia tử ngoại ion hóa khí hydrogen. Khi electron kết hợp lại với proton, nó “rơi bậc thang” xuống dần và phát ra nhiều vạch, trong đó Hα 656,3 nm rất mạnh. Vì vậy ảnh chụp các tinh vân phát xạ như Tinh vân Lạp Hộ (M42) thường có màu hồng đỏ.',
            'Kính lọc Hα cũng được dùng để quan sát lớp sắc quyển và các tai lửa của Mặt Trời, những cấu trúc gần như không thấy được trong ánh sáng trắng.',
          ] },
        { h: 'Lyman α: vạch quan trọng nhưng phải lên vũ trụ mới thấy', refs: ['astro2e', 'nist'],
          p: [
            'Vạch Lyman α (121,6 nm) là vạch mạnh nhất của hydrogen, nhưng bị khí quyển Trái Đất hấp thụ, nên chỉ quan sát được bằng kính thiên văn đặt ngoài không gian. Với các thiên hà rất xa, vạch này bị dịch về phía đỏ do vũ trụ giãn nở, đôi khi dịch vào tận vùng nhìn thấy, giúp các nhà thiên văn đo khoảng cách tới chúng.',
          ] },
      ],
    },

    // 5 — Quang phổ liên tục, phát xạ và hấp thụ
    spectra: {
      try: [
        'Chọn “Vật rắn nóng sáng”: có khoảng màu nào bị thiếu không?',
        'Chọn “Khí nóng” rồi “Khí lạnh chắn trước nguồn sáng” với cùng nguyên tố: các vạch sáng và vạch tối nằm ở đâu so với nhau?',
        'Đổi giữa Hydrogen và Sodium: bộ vạch có giống nhau không?',
      ],
      myth: {
        wrong: 'Vạch tối trong quang phổ Mặt Trời là chỗ hoàn toàn không có ánh sáng.',
        right: 'Vạch tối chỉ tối hơn so với xung quanh. Lớp khí bên ngoài hấp thụ các photon có đúng bước sóng đó rồi phát lại chúng theo mọi hướng, nên ánh sáng đi thẳng về phía ta ở bước sóng ấy yếu đi rõ rệt, nhưng không về 0.',
        refs: ['astro2e'],
      },
      deep: [
        { h: 'Vạch Fraunhofer: bí ẩn trong ánh sáng Mặt Trời', refs: ['astro2e', 'kirchhoff'],
          p: [
            'Năm 1814, Joseph von Fraunhofer dùng kính quang phổ do chính ông chế tạo và ghi lại vị trí của hơn 500 vạch tối trong quang phổ Mặt Trời. Ông đặt tên các vạch đậm nhất bằng chữ cái, như vạch D ở vùng vàng. Gần nửa thế kỷ sau, Kirchhoff và Bunsen chứng minh vạch D trùng đúng vị trí vạch phát xạ của sodium, nghĩa là bầu khí quyển Mặt Trời có sodium.',
          ] },
        { h: 'Ba quy luật Kirchhoff, giải thích bằng nguyên tử', refs: ['astro2e'],
          p: [
            'Trong vật rắn hay khí rất đặc, các nguyên tử tương tác chặt với nhau, các mức năng lượng hòa vào nhau thành vùng liên tục, nên vật nóng phát ra mọi bước sóng. Trong khí loãng, mỗi nguyên tử gần như đứng riêng, giữ nguyên bộ mức năng lượng của mình, nên chỉ phát hoặc hấp thụ ở các bước sóng riêng. Vạch phát xạ và vạch hấp thụ của cùng một nguyên tố trùng nhau vì cả hai đều do cùng các cặp mức năng lượng tạo ra.',
          ] },
        { h: 'Màu sắc và nhiệt độ của ngôi sao', refs: ['astro2e', 'codata'],
          p: [
            R`Phần liên tục trong quang phổ một ngôi sao gần giống bức xạ của một vật nóng lý tưởng (vật đen). Bước sóng sáng nhất tuân theo định luật Wien: $$\lambda_{\max} = \frac{b}{T},\qquad b \approx 2{,}898 \times 10^{-3}\ \mathrm{m\cdot K}$$`,
            R`Với Mặt Trời, nhiệt độ bề mặt hiệu dụng khoảng $T \approx 5772\ \mathrm{K}$, cho $\lambda_{\max} \approx 500\ \mathrm{nm}$. Sao nóng hơn sáng nhất ở bước sóng ngắn hơn nên trông xanh trắng; sao nguội hơn trông đỏ cam.`,
          ] },
        { h: 'Ngôi sao được làm từ gì?', refs: ['astro2e'],
          p: [
            'Năm 1925, Cecilia Payne phân tích quang phổ các ngôi sao và cho thấy chúng được cấu tạo chủ yếu từ hydrogen và helium, điều trái hẳn với quan niệm thời đó. Ngày nay, đây là hiểu biết nền tảng: phần lớn vật chất thông thường trong các ngôi sao là hydrogen và helium, các nguyên tố khác chỉ chiếm một phần nhỏ.',
          ] },
      ],
    },

    // 6 — Vạch nguyên tử và dải phân tử
    bands: {
      try: [
        'Đặt thanh trượt về 0 (nguyên tử): có bao nhiêu vạch?',
        'Tăng dần số mức dao động: các vạch thay đổi thế nào, và lúc nào bắt đầu trông giống một “dải”?',
        'Mở thí nghiệm Ngọn lửa, chọn Sr rồi Li, nhìn qua kính phân quang để so sánh dải và vạch thật.',
      ],
      myth: {
        wrong: 'Màu của ngọn lửa khi đốt muối kim loại hoàn toàn do nguyên tử kim loại phát ra.',
        right: 'Với sodium, lithium, potassium thì đúng là chủ yếu do nguyên tử. Nhưng với calcium, strontium, barium và copper, phần lớn ánh sáng ta thấy đến từ các phân tử nhỏ hình thành ngay trong lửa như CaOH, SrOH, BaCl, CuCl. Vì vậy quang phổ của chúng có những dải rộng chứ không chỉ có vạch mảnh.',
        refs: ['gaydon'],
      },
      deep: [
        { h: 'Ba “tầng” năng lượng của phân tử', refs: ['gaydon', 'chem2e'],
          p: [
            'Năng lượng của phân tử gồm ba phần, cách nhau rất xa về độ lớn: năng lượng của electron (cỡ vài eV, giống nguyên tử), năng lượng dao động của các nguyên tử trong phân tử (thường cỡ một phần mười eV) và năng lượng quay của cả phân tử (nhỏ hơn nữa, cỡ một phần nghìn eV).',
            'Mỗi chuyển mức điện tử vì thế luôn đi kèm thay đổi về dao động và quay. Kết quả là thay vì một vạch, ta có rất nhiều vạch xếp sát nhau. Kính phân quang đơn giản không tách được chúng, nên ta thấy một dải sáng, thường có một mép sắc gọi là đầu dải.',
          ] },
        { h: 'Dải Swan của C₂: từ ngọn nến đến sao chổi', refs: ['gaydon'],
          p: [
            'Màu xanh lam của phần đáy ngọn lửa đèn khí, bếp ga hay ngọn nến chủ yếu do các gốc CH và phân tử C₂ phát ra. Các dải của C₂ được gọi là dải Swan, theo tên nhà vật lý William Swan, người mô tả chúng vào giữa thế kỷ 19. Chính các dải này cũng xuất hiện trong quang phổ đầu nhiều sao chổi, tạo nên màu xanh lục của chúng.',
          ] },
        { h: 'Vì sao dải phân tử quan trọng?', refs: ['gaydon', 'astro2e'],
          p: [
            'Trong ngọn lửa, khí quyển các hành tinh và các ngôi sao nguội, phân tử có thể tồn tại mà không bị phá vỡ. Nhận ra dải của chúng giúp các nhà khoa học biết có những phân tử nào và ở nhiệt độ bao nhiêu, vì phân bố cường độ trong dải phụ thuộc nhiệt độ.',
          ] },
      ],
    },

    // 7 — Trạng thái giả bền và dập tắt do va chạm
    quench: {
      try: [
        'Kéo thanh “Mật độ khí” về phía khí loãng (≈ 300 km): cả hai vạch có sáng không?',
        'Kéo dần về phía khí đặc: vạch nào tắt trước? Nó có thời gian sống dài hay ngắn?',
        'Mở thí nghiệm Cực quang và giảm năng lượng electron để kiểm tra dự đoán của bạn.',
      ],
      myth: {
        wrong: 'Cực quang có màu đỏ ở trên và xanh ở dưới vì nhiệt độ ở các độ cao khác nhau.',
        right: 'Màu không do nhiệt độ quyết định. Nó phụ thuộc chất khí nào bị kích thích, lên trạng thái nào, và trạng thái đó có kịp phát sáng trước khi bị va chạm hay không. Ở trên cao, khí loãng cho phép trạng thái sống lâu ¹D của oxygen phát màu đỏ; xuống thấp, chỉ trạng thái sống ngắn hơn ¹S còn kịp phát màu xanh lục.',
        refs: ['slanger', 'rees'],
      },
      deep: [
        { h: 'Hai con số quyết định: thời gian sống và tần suất va chạm', refs: ['slanger', 'nist'],
          p: [
            R`Mỗi trạng thái kích thích có một thời gian sống $\tau$ đặc trưng. Với oxygen nguyên tử, trạng thái $^{1}\mathrm{S}$ (phát 557,7 nm) có $\tau$ khoảng 0,7–0,8 s, còn trạng thái $^{1}\mathrm{D}$ (phát 630,0 và 636,4 nm) có $\tau$ khoảng 110 s.`,
            R`Gọi $\nu$ là số lần một nguyên tử va chạm mỗi giây. Nếu $\nu\tau$ nhỏ hơn 1 nhiều, nguyên tử thường kịp phát sáng; nếu $\nu\tau$ lớn hơn 1 nhiều, nó gần như chắc chắn bị dập tắt trước. Khí càng đặc thì $\nu$ càng lớn.`,
          ] },
        { h: 'Khí quyển loãng đi nhanh thế nào?', refs: ['rees'],
          p: [
            'Mật độ không khí giảm rất nhanh theo độ cao: ở khoảng 100 km, nó chỉ còn cỡ một phần triệu so với mặt đất, và lên tới khoảng 300 km thì còn loãng hơn hàng nghìn đến hàng chục nghìn lần nữa. Vì vậy, tần suất va chạm của một nguyên tử cũng giảm từ cỡ hàng nghìn lần mỗi giây ở gần 100 km xuống dưới khoảng một lần mỗi giây ở vài trăm kilomet. Đó là lý do trạng thái “chờ 110 giây” chỉ sống sót được ở tầng rất cao.',
          ] },
        { h: 'Ai “cướp” năng lượng?', refs: ['slanger', 'solomon'],
          p: [
            R`Trạng thái $^{1}\mathrm{D}$ của oxygen bị dập tắt chủ yếu khi va chạm với phân tử N₂, ngoài ra với O₂ và nguyên tử O. Trạng thái $^{1}\mathrm{S}$ bị dập tắt mạnh bởi O₂ và nguyên tử O, nên vạch xanh lục cũng yếu đi ở dưới khoảng 100 km. Các mô hình tính toán dựa trên những quá trình này cho kết quả khớp tốt với cường độ vạch đỏ đo được trong cực quang.`,
          ] },
        { h: 'Cùng những vạch ấy, ngay cả khi không có cực quang', refs: ['slanger'],
          p: [
            'Bầu trời đêm không bao giờ tối hoàn toàn. Các phản ứng hóa học ở tầng cao khí quyển cũng tạo ra oxygen ở trạng thái kích thích, phát ra vạch 557,7 nm và 630,0 nm rất yếu trên khắp địa cầu. Hiện tượng này gọi là ánh sáng khí quyển ban đêm (airglow); ảnh chụp từ Trạm Vũ trụ Quốc tế thường thấy nó như một lớp viền xanh mỏng quanh Trái Đất.',
          ] },
      ],
    },

    // 8 — Hạt mang điện trong từ trường Trái Đất
    field: {
      try: [
        'Chọn “Không có từ trường”: các hạt đi đâu?',
        'Chọn lại “Có từ trường”: hạt đổ xuống ở những vùng nào trên Trái Đất?',
        'Mở thí nghiệm Cực quang, tăng “Hoạt động Mặt Trời” và xem chỉ số Kp thay đổi.',
      ],
      myth: {
        wrong: 'Cực quang là ánh sáng Mặt Trời phản chiếu từ băng tuyết ở vùng cực.',
        right: 'Cực quang là ánh sáng do chính chất khí ở tầng cao khí quyển phát ra, khi bị các electron năng lượng cao va vào, ở độ cao khoảng 90–300 km hoặc hơn. Nó không liên quan đến băng tuyết, và quang phổ của nó gồm các vạch riêng của oxygen và nitrogen, khác hẳn ánh sáng Mặt Trời phản chiếu.',
        refs: ['swpcAurora', 'rees'],
      },
      deep: [
        { h: 'Lực Lorentz và chuyển động xoắn ốc', refs: ['baumjohann'],
          p: [
            R`Hạt mang điện $q$ chuyển động với vận tốc $\vec v$ trong từ trường $\vec B$ chịu lực Lorentz $\vec F = q\,\vec v \times \vec B$. Lực này luôn vuông góc với vận tốc nên không làm hạt nhanh hay chậm đi, chỉ bẻ cong đường đi. Kết quả: hạt quay tròn quanh đường sức, đồng thời trượt dọc theo nó, vẽ thành một đường xoắn ốc.`,
            R`Bán kính vòng xoắn là $r = \dfrac{m v_\perp}{|q|B}$. Với một electron 1 keV trong từ trường khoảng $5 \times 10^{-5}\ \mathrm{T}$ (cỡ từ trường gần mặt đất ở vùng cực), bán kính này chỉ cỡ vài mét. Electron vì thế gần như bị “buộc chặt” vào đường sức từ.`,
          ] },
        { h: 'Gương từ và vành đai bức xạ', refs: ['baumjohann'],
          p: [
            'Khi hạt đi về phía cực, các đường sức chụm lại và từ trường mạnh lên. Từ trường mạnh dần có thể đẩy hạt quay ngược lại, như một tấm gương, nên nhiều hạt bị “nhốt”, nảy qua lại giữa hai bán cầu. Đây là cơ chế giữ các hạt trong vành đai bức xạ Van Allen, được vệ tinh Explorer 1 phát hiện năm 1958. Chỉ những hạt đi gần như dọc theo đường sức mới xuyên được xuống tới tầng khí quyển đủ dày để gây ra cực quang.',
          ] },
        { h: 'Vành cực quang', refs: ['paschmann', 'swpcAurora'],
          p: [
            'Cực quang không xuất hiện ngay tại cực, mà tập trung trên một vành hình bầu dục bao quanh mỗi cực từ, gọi là vành cực quang. Lúc bình thường, vành này nằm ở vĩ độ địa từ cao (khoảng 65–70°), đi qua các vùng như bắc Na Uy, Iceland, Alaska, bắc Canada. Electron tạo nên các dải cực quang sáng rõ thường được gia tốc lên vài nghìn eV ở độ cao khoảng vài nghìn kilomet phía trên, trước khi lao xuống khí quyển.',
          ] },
        { h: 'Bão từ và chỉ số Kp', refs: ['swpcKp', 'swpcAurora'],
          p: [
            'Khi Mặt Trời phóng ra những đám plasma lớn (phóng khối lượng vành nhật hoa) hướng về Trái Đất, từ quyển bị nén và nhận thêm rất nhiều năng lượng, gây ra bão từ. Khi đó vành cực quang sáng hơn và mở rộng về phía xích đạo, nên cực quang có thể được thấy ở những vĩ độ thấp hơn nhiều so với bình thường.',
            'Chỉ số Kp (từ 0 đến 9) do các đài từ kế trên mặt đất đo, cho biết mức xáo động của từ trường Trái Đất trong mỗi khoảng 3 giờ. NOAA dùng chỉ số này trong thang bão từ G1–G5 và trong các bản dự báo cực quang.',
          ] },
      ],
    },
  };
})();
