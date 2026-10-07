/* Aurora-LAB — CƠ SỞ DỮ LIỆU DUY NHẤT cho nguyên tố, mức năng lượng và vạch phổ.
 *
 * Quy ước
 *  - nm : bước sóng trong không khí (nm). Dưới 200 nm là bước sóng chân không.
 *  - E  : năng lượng của mức (eV), tính từ trạng thái cơ bản.
 *  - x  : khả năng được kích thích lên mức đó khi bấm "Cấp năng lượng" (tương đối).
 *  - p  : trọng số tương đối của các chuyển mức xuất phát từ cùng một mức
 *         (x và p là trọng số dùng cho hoạt cảnh, không phải hệ số Einstein).
 *  - nr : chuyển mức không bức xạ (mất năng lượng do va chạm).
 *  - src: 'NIST' = vạch nguyên tử theo NIST ASD; '≈' = dải phân tử (ghi vị trí cực đại).
 */
(function () {
  'use strict';
  const AL = (window.AL = window.AL || {});

  const species = {
    O: {
      sym: 'O', name: 'Oxygen', vi: 'oxi', color: '#7dff72', Z: 8, core: [2, 5], ion: 13.618,
      note: 'Oxygen (Z = 8, cấu hình 1s²2s²2p⁴). Cấu hình 2p⁴ cho ba số hạng ³P, ¹D và ¹S. Các chuyển mức ¹S → ¹D (557,7 nm) và ¹D → ³P (630,0 nm) là chuyển mức cấm, nên hai trạng thái kích thích này có thời gian sống dài; đây chính là nguồn gốc hai màu đặc trưng của cực quang.',
      levels: [
        { id: '3P', t: '³P', tl: '2p⁴ ³P (cơ bản)', E: 0 },
        { id: '1D', t: '¹D', tl: '2p⁴ ¹D', E: 1.967, x: 0.4, meta: true, tau: '≈ 110 s' },
        { id: '1S', t: '¹S', tl: '2p⁴ ¹S', E: 4.19, x: 0.6, meta: true, tau: '≈ 0,74 s' },
      ],
      trans: [
        { u: '1S', l: '1D', nm: 557.7, p: 0.95, name: 'vạch xanh lục cực quang', d: 'Màu cực quang phổ biến nhất. Đây là vạch cấm: trạng thái ¹S có thời gian sống khoảng 0,74 s trước khi phát xạ.' },
        { u: '1S', l: '3P', nm: 297.2, p: 0.05, d: 'Vạch tử ngoại, rất hiếm xảy ra.' },
        { u: '1D', l: '3P', nm: 630.0, p: 0.76, name: 'vạch đỏ cực quang', d: 'Trạng thái ¹D có thời gian sống khoảng 110 s, nên chỉ phát xạ được ở độ cao lớn (> 200 km), nơi mật độ khí đủ thấp để năng lượng kích thích không bị mất qua va chạm.' },
        { u: '1D', l: '3P', nm: 636.4, p: 0.24, d: 'Vạch đỏ yếu hơn, cùng xuất phát từ ¹D như vạch 630,0 nm nhưng kết thúc ở mức con ³P₁.' },
      ],
    },

    H: {
      sym: 'H', name: 'Hydrogen', vi: 'hiđro', color: '#ff6f91', Z: 1, core: [], ion: 13.606,
      axis: [[0, 0.7, 0.12], [9.75, 13.75, 0.88]],
      note: 'Hydrogen (Z = 1) là hệ một electron, năng lượng các mức tuân theo hệ thức Eₙ = −13,6/n² eV. Các chuyển mức về n = 2 tạo dãy Balmer nằm trong vùng khả kiến.',
      levels: [
        { id: 'n1', t: 'n = 1', tl: 'n = 1 (cơ bản)', E: 0 },
        { id: 'n2', t: 'n = 2', E: 10.204, x: 0.1 },
        { id: 'n3', t: 'n = 3', E: 12.094, x: 0.34 },
        { id: 'n4', t: 'n = 4', E: 12.755, x: 0.26 },
        { id: 'n5', t: 'n = 5', E: 13.061, x: 0.18 },
        { id: 'n6', t: 'n = 6', E: 13.228, x: 0.12 },
      ],
      trans: [
        { u: 'n2', l: 'n1', nm: 121.6, p: 1, name: 'Lyman α', d: 'Vạch mạnh nhất của hydrogen, nằm trong vùng tử ngoại xa; bị khí quyển hấp thụ nên chỉ quan sát được bằng kính thiên văn ngoài không gian.' },
        { u: 'n3', l: 'n1', nm: 102.6, p: 0.3, name: 'Lyman β' },
        { u: 'n4', l: 'n1', nm: 97.3, p: 0.3, name: 'Lyman γ' },
        { u: 'n5', l: 'n1', nm: 95.0, p: 0.3, name: 'Lyman δ' },
        { u: 'n6', l: 'n1', nm: 93.8, p: 0.3, name: 'Lyman ε' },
        { u: 'n3', l: 'n2', nm: 656.3, p: 0.7, name: 'Hα (Balmer)', d: 'Vạch đỏ nổi tiếng nhất thiên văn học: các tinh vân phát xạ như Tinh vân Lạp Hộ (M42) có màu hồng đỏ nhờ vạch này.' },
        { u: 'n4', l: 'n2', nm: 486.1, p: 0.5, name: 'Hβ (Balmer)', d: 'Vạch xanh lam trong dãy Balmer.' },
        { u: 'n5', l: 'n2', nm: 434.0, p: 0.5, name: 'Hγ (Balmer)', d: 'Vạch tím-lam trong dãy Balmer.' },
        { u: 'n6', l: 'n2', nm: 410.2, p: 0.5, name: 'Hδ (Balmer)', d: 'Vạch tím, sát rìa vùng mắt nhìn thấy.' },
        { u: 'n4', l: 'n3', nm: 1875.1, p: 0.2, name: 'Paschen α', d: 'Dãy Paschen (chuyển mức về n = 3) nằm trong vùng hồng ngoại.' },
        { u: 'n5', l: 'n3', nm: 1281.8, p: 0.2, name: 'Paschen β' },
        { u: 'n6', l: 'n3', nm: 1093.8, p: 0.2, name: 'Paschen γ' },
      ],
    },

    Na: {
      sym: 'Na', name: 'Sodium', vi: 'natri', color: '#ffb43b', Z: 11, core: [2, 8], ion: 5.139,
      note: 'Sodium (Z = 11, cấu hình [Ne]3s¹). Các chuyển mức của electron hóa trị đều đi qua mức 3p trước khi về 3s, vì vậy phổ phát xạ bị chi phối bởi vạch đôi D 589,0 / 589,6 nm.',
      levels: [
        { id: '3s', t: '3s', tl: '3s ²S (cơ bản)', E: 0 },
        { id: '3p', t: '3p', tl: '3p ²P', E: 2.104, x: 0.5 },
        { id: '4s', t: '4s', tl: '4s ²S', E: 3.191, x: 0.1 },
        { id: '3d', t: '3d', tl: '3d ²D', E: 3.617, x: 0.15 },
        { id: '5s', t: '5s', tl: '5s ²S', E: 4.116, x: 0.1 },
        { id: '4d', t: '4d', tl: '4d ²D', E: 4.284, x: 0.15 },
      ],
      trans: [
        { u: '3p', l: '3s', nm: 589.0, p: 1, name: 'vạch D', d: 'Vạch D của sodium, thực chất là vạch đôi 589,0 và 589,6 nm do tách mức tinh tế của 3p. Đây là màu vàng cam của đèn hơi sodium và của NaCl trong ngọn lửa.' },
        { u: '4s', l: '3p', nm: 1138.2, p: 1 },
        { u: '3d', l: '3p', nm: 818.3, p: 1 },
        { u: '5s', l: '3p', nm: 616.1, p: 1, d: 'Vạch cam yếu (5s → 3p).' },
        { u: '4d', l: '3p', nm: 568.8, p: 1, d: 'Vạch vàng lục yếu (4d → 3p).' },
      ],
    },

    Li: {
      sym: 'Li', name: 'Lithium', vi: 'liti', color: '#ff3d6e', Z: 3, core: [2], ion: 5.392,
      note: 'Lithium (Z = 3, cấu hình [He]2s¹). Chuyển mức cộng hưởng 2p → 2s cho vạch đỏ son 670,8 nm, quyết định màu ngọn lửa đặc trưng của lithium.',
      levels: [
        { id: '2s', t: '2s', tl: '2s ²S (cơ bản)', E: 0 },
        { id: '2p', t: '2p', tl: '2p ²P', E: 1.848, x: 0.55 },
        { id: '3s', t: '3s', tl: '3s ²S', E: 3.373, x: 0.15 },
        { id: '3d', t: '3d', tl: '3d ²D', E: 3.879, x: 0.2 },
        { id: '4d', t: '4d', tl: '4d ²D', E: 4.541, x: 0.1 },
      ],
      trans: [
        { u: '2p', l: '2s', nm: 670.8, p: 1, d: 'Vạch đỏ son (carmine) tạo màu lửa đặc trưng của lithium.' },
        { u: '3s', l: '2p', nm: 812.6, p: 1 },
        { u: '3d', l: '2p', nm: 610.4, p: 1, d: 'Vạch cam, yếu hơn nhiều so với 670,8 nm.' },
        { u: '4d', l: '2p', nm: 460.3, p: 1, d: 'Vạch lam rất yếu.' },
      ],
    },

    K: {
      sym: 'K', name: 'Potassium', vi: 'kali', color: '#c79bff', Z: 19, core: [2, 8, 8], ion: 4.341,
      note: 'Potassium (Z = 19, cấu hình [Ar]4s¹). Vạch cộng hưởng 766,5 / 769,9 nm nằm sát vùng hồng ngoại, kết hợp với vạch tím 404,4 nm tạo nên màu tím hoa cà nhạt của ngọn lửa.',
      levels: [
        { id: '4s', t: '4s', tl: '4s ²S (cơ bản)', E: 0 },
        { id: '4p', t: '4p', tl: '4p ²P', E: 1.615, x: 0.55 },
        { id: '5s', t: '5s', tl: '5s ²S', E: 2.607, x: 0.15 },
        { id: '5p', t: '5p', tl: '5p ²P', E: 3.064, x: 0.2 },
        { id: '6s', t: '6s', tl: '6s ²S', E: 3.403, x: 0.1 },
      ],
      trans: [
        { u: '4p', l: '4s', nm: 766.5, p: 1, d: 'Vạch đỏ sẫm (vạch đôi với 769,9 nm), nằm sát rìa hồng ngoại nên mắt kém nhạy.' },
        { u: '5s', l: '4p', nm: 1252.2, p: 1 },
        { u: '5p', l: '4s', nm: 404.4, p: 0.4, d: 'Vạch tím; cùng vạch đỏ sẫm tạo màu tím hoa cà của lửa potassium.' },
        { u: '5p', l: '5s', nm: 2712.6, p: 0.6 },
        { u: '6s', l: '4p', nm: 693.9, p: 0.6, d: 'Vạch đỏ yếu.' },
        { u: '6s', l: '5p', nm: 3650.0, p: 0.4 },
      ],
    },

    Ca: {
      sym: 'Ca', name: 'Calcium', vi: 'canxi', color: '#ff7a2f', Z: 20, core: [2, 8, 8, 1], ion: 6.113,
      note: 'Calcium (Z = 20, cấu hình [Ar]4s²). Vạch cộng hưởng của nguyên tử là 422,7 nm; màu đỏ gạch của ngọn lửa chủ yếu do phát xạ của phân tử CaOH hình thành trong ngọn lửa.',
      levels: [
        { id: '1S', t: '¹S₀', tl: '4s² ¹S₀ (cơ bản)', E: 0 },
        { id: '3P', t: '³P₁', tl: '4s4p ³P₁', E: 1.886, x: 0.2, meta: true, tau: '≈ 0,4 ms' },
        { id: '1P', t: '¹P₁', tl: '4s4p ¹P₁', E: 2.933, x: 0.55 },
        { id: '3S', t: '³S₁', tl: '4s5s ³S₁', E: 3.91, x: 0.25 },
      ],
      trans: [
        { u: '1P', l: '1S', nm: 422.7, p: 1, d: 'Vạch mạnh nhất của nguyên tử calcium.' },
        { u: '3P', l: '1S', nm: 657.3, p: 1, d: 'Chuyển mức liên tổ hợp (thay đổi độ bội spin) nên cường độ rất yếu.' },
        { u: '3S', l: '3P', nm: 616.2, p: 0.55, d: 'Bộ ba vạch cam-đỏ 610,3 / 612,2 / 616,2 nm (³S → ³P).' },
        { u: '3S', l: '3P', nm: 612.2, p: 0.3 },
        { u: '3S', l: '3P', nm: 610.3, p: 0.15 },
      ],
    },

    Sr: {
      sym: 'Sr', name: 'Strontium', vi: 'stronti', color: '#ff3048', Z: 38, core: [2, 8, 18, 8, 1], ion: 5.695,
      note: 'Strontium (Z = 38, cấu hình [Kr]5s²). Vạch cộng hưởng của nguyên tử là 460,7 nm; màu đỏ thẫm của ngọn lửa chủ yếu do các dải phát xạ của phân tử SrOH.',
      levels: [
        { id: '1S', t: '¹S₀', tl: '5s² ¹S₀ (cơ bản)', E: 0 },
        { id: '3P', t: '³P₁', tl: '5s5p ³P₁', E: 1.798, x: 0.25, meta: true, tau: '≈ 21 µs' },
        { id: '1P', t: '¹P₁', tl: '5s5p ¹P₁', E: 2.69, x: 0.5 },
        { id: '3S', t: '³S₁', tl: '5s6s ³S₁', E: 3.6, x: 0.25 },
      ],
      trans: [
        { u: '1P', l: '1S', nm: 460.7, p: 1, d: 'Vạch mạnh nhất của nguyên tử strontium. Dù lửa có màu đỏ, phổ vẫn có vạch lam này.' },
        { u: '3P', l: '1S', nm: 689.3, p: 1, d: 'Chuyển mức liên tổ hợp, vạch rất hẹp.' },
        { u: '3S', l: '3P', nm: 707.0, p: 0.55, d: 'Bộ ba vạch đỏ 679,1 / 688,0 / 707,0 nm (³S → ³P).' },
        { u: '3S', l: '3P', nm: 688.0, p: 0.33 },
        { u: '3S', l: '3P', nm: 679.1, p: 0.12 },
      ],
    },

    Ba: {
      sym: 'Ba', name: 'Barium', vi: 'bari', color: '#b6ff5c', Z: 56, core: [2, 8, 18, 18, 8, 1], ion: 5.212,
      note: 'Barium (Z = 56, cấu hình [Xe]6s²). Vạch cộng hưởng 553,5 nm cùng các dải phân tử BaOH và BaCl tạo nên màu xanh lục táo của ngọn lửa.',
      levels: [
        { id: '1S', t: '¹S₀', tl: '6s² ¹S₀ (cơ bản)', E: 0 },
        { id: '3P', t: '³P₁', tl: '6s6p ³P₁', E: 1.567, x: 0.3, meta: true, tau: '≈ 1,3 µs' },
        { id: '1P', t: '¹P₁', tl: '6s6p ¹P₁', E: 2.239, x: 0.7 },
      ],
      trans: [
        { u: '1P', l: '1S', nm: 553.5, p: 1, d: 'Vạch mạnh nhất của nguyên tử barium.' },
        { u: '3P', l: '1S', nm: 791.1, p: 1, d: 'Vạch liên tổ hợp, nằm trong vùng hồng ngoại gần.' },
      ],
    },

    Cu: {
      sym: 'Cu', name: 'Copper', vi: 'đồng', color: '#36e6c4', Z: 29, core: [2, 8, 18], ion: 7.726,
      note: 'Copper (Z = 29, cấu hình [Ar]3d¹⁰4s¹). Phổ có nhóm vạch xanh lục 510,6 / 515,3 / 521,8 nm. Hai mức ²D (cấu hình 3d⁹4s²) là mức giả bền; trong ngọn lửa chúng mất năng lượng qua va chạm thay vì phát xạ.',
      levels: [
        { id: '2S', t: '4s ²S', tl: '3d¹⁰4s ²S (cơ bản)', E: 0 },
        { id: 'D52', t: '²D₅/₂', tl: '3d⁹4s² ²D₅/₂', E: 1.389, meta: true, tau: 'rất lâu' },
        { id: 'D32', t: '²D₃/₂', tl: '3d⁹4s² ²D₃/₂', E: 1.642, meta: true, tau: 'rất lâu' },
        { id: '4p', t: '4p ²P', tl: '3d¹⁰4p ²P', E: 3.8, x: 0.6 },
        { id: '4d', t: '4d ²D', tl: '3d¹⁰4d ²D', E: 6.19, x: 0.4 },
      ],
      trans: [
        { u: '4p', l: '2S', nm: 324.8, p: 0.6, d: 'Vạch tử ngoại, mạnh nhất của copper.' },
        { u: '4p', l: 'D52', nm: 510.6, p: 0.25, d: 'Vạch xanh lục 510,6 nm.' },
        { u: '4p', l: 'D32', nm: 578.2, p: 0.15, d: 'Vạch vàng 578,2 nm.' },
        { u: '4d', l: '4p', nm: 521.8, p: 0.55, d: 'Vạch xanh lục 521,8 nm (4d → 4p).' },
        { u: '4d', l: '4p', nm: 515.3, p: 0.45, d: 'Vạch xanh lục 515,3 nm (4d → 4p).' },
        { u: 'D52', l: '2S', nr: true, p: 1 },
        { u: 'D32', l: '2S', nr: true, p: 1 },
      ],
    },

    N2p: {
      sym: 'N₂⁺', name: 'Ion nitrogen phân tử', vi: 'ion nitơ phân tử', color: '#9a86ff', model: 'molecule', core: [], ion: null,
      note: 'Trong cực quang, electron năng lượng cao ion hóa phân tử N₂, tạo ion N₂⁺ ở trạng thái kích thích B²Σu⁺. Trạng thái này phát xạ gần như tức thời (khoảng 60 ns) thành hệ dải âm thứ nhất ở 391,4 và 427,8 nm.',
      levels: [
        { id: 'X0', t: 'X v=0', tl: 'X²Σg⁺, v = 0 (cơ bản)', E: 0 },
        { id: 'X1', t: 'X v=1', tl: 'X²Σg⁺, v = 1 (dao động)', E: 0.27 },
        { id: 'X2', t: 'X v=2', tl: 'X²Σg⁺, v = 2 (dao động)', E: 0.535 },
        { id: 'B0', t: 'B v=0', tl: 'B²Σu⁺, v = 0', E: 3.168, x: 1 },
      ],
      trans: [
        { u: 'B0', l: 'X0', nm: 391.4, p: 0.65, name: 'dải âm thứ nhất (0–0)', d: 'Vạch tím sát vùng tử ngoại, mắt kém nhạy nhưng máy ảnh ghi nhận rõ.' },
        { u: 'B0', l: 'X1', nm: 427.8, p: 0.28, name: 'dải âm thứ nhất (0–1)', d: 'Màu tím-lam ở rìa dưới của những dải cực quang mạnh.' },
        { u: 'B0', l: 'X2', nm: 470.9, p: 0.07, name: 'dải âm thứ nhất (0–2)', d: 'Vạch lam yếu.' },
        { u: 'X1', l: 'X0', nr: true, p: 1 },
        { u: 'X2', l: 'X1', nr: true, p: 1 },
      ],
    },
  };

  // Thử nghiệm ngọn lửa: màu lửa nhìn thấy + vạch/dải phát xạ (I: cường độ tương đối, w: bề rộng dải, nm).
  const flame = {
    Na: { salt: 'NaCl', look: 'vàng cam rực', glow: '#ffb02a', bright: 1.15,
      lines: [{ nm: 589.0, I: 1 }, { nm: 589.6, I: 0.55, d: 'Vạch D₁, cặp đôi với 589,0 nm.' }],
      tip: 'Vạch đôi D 589,0 / 589,6 nm mạnh tới mức lấn át màu của hầu hết các nguyên tố khác.' },
    Li: { salt: 'LiCl', look: 'đỏ son', glow: '#ff2f61', bright: 1,
      lines: [{ nm: 670.8, I: 1 }, { nm: 610.4, I: 0.18 }, { nm: 460.3, I: 0.05 }],
      tip: 'Một vạch đỏ 670,8 nm rất mạnh, gần như đứng một mình.' },
    K: { salt: 'KCl', look: 'tím hoa cà nhạt', glow: '#c6a4ff', bright: 0.72,
      lines: [{ nm: 766.5, I: 1 }, { nm: 769.9, I: 0.6, d: 'Cặp đôi với 766,5 nm.' }, { nm: 404.4, I: 0.38 }, { nm: 404.7, I: 0.2, d: 'Cặp đôi với 404,4 nm.' }],
      tip: 'Hai đầu quang phổ: vạch đỏ sẫm ~767 nm và vạch tím ~404 nm. Nếu lẫn sodium, phải nhìn qua kính coban xanh để chặn màu vàng.' },
    Ca: { salt: 'CaCl₂', look: 'đỏ gạch – cam', glow: '#ff6a26', bright: 0.95,
      lines: [{ nm: 422.7, I: 0.35 }, { nm: 554, I: 0.6, w: 12, mol: 'CaOH' }, { nm: 622, I: 1, w: 18, mol: 'CaOH' }],
      tip: 'Dải cam-đỏ rộng quanh 622 nm và dải lục quanh 554 nm của phân tử CaOH.' },
    Sr: { salt: 'SrCl₂', look: 'đỏ thẫm', glow: '#ff1f3a', bright: 1,
      lines: [{ nm: 460.7, I: 0.35 }, { nm: 606, I: 0.55, w: 10, mol: 'SrOH' }, { nm: 662, I: 1, w: 30, mol: 'SrOH / SrCl' }],
      tip: 'Dải đỏ rộng 640–690 nm, dải cam ~606 nm và một vạch lam 460,7 nm. Khác hẳn vạch đỏ đơn lẻ của lithium.' },
    Ba: { salt: 'BaCl₂', look: 'xanh lục táo', glow: '#b9ff66', bright: 0.9,
      lines: [{ nm: 553.5, I: 0.7 }, { nm: 487, I: 0.35, w: 6, mol: 'BaOH' }, { nm: 513, I: 0.8, w: 8, mol: 'BaOH' }, { nm: 524, I: 1, w: 6, mol: 'BaCl' }],
      tip: 'Cụm vạch và dải xanh lục 510–555 nm.' },
    Cu: { salt: 'CuCl₂', look: 'xanh lam – lục', glow: '#2fe8c2', bright: 0.95,
      lines: [{ nm: 510.6, I: 0.55 }, { nm: 515.3, I: 0.45 }, { nm: 521.8, I: 0.6 }, { nm: 435, I: 0.6, w: 30, mol: 'CuCl' }, { nm: 535, I: 0.5, w: 24, mol: 'CuOH' }],
      tip: 'Bộ ba vạch xanh lục 510–522 nm cộng dải lam rộng của CuCl.' },
  };
  const FLAME_ORDER = ['Na', 'Cu', 'Sr', 'Ba', 'K', 'Li', 'Ca'];

  // Lửa đèn khí chưa có muối: gốc CH và C₂ (dải Swan).
  const extra = {
    fuel: { sym: 'CH·C₂', name: 'Khí đốt', vi: 'lửa đèn khí', color: '#5b8cff',
      lines: [{ nm: 431.4, I: 0.5, w: 4, mol: 'CH', d: 'Dải của gốc CH: tạo màu lam của lửa đèn khí.' }, { nm: 516.5, I: 0.4, w: 5, mol: 'C₂ (dải Swan)', d: 'Dải Swan của phân tử C₂.' }, { nm: 473.7, I: 0.22, w: 5, mol: 'C₂ (dải Swan)', d: 'Dải Swan của phân tử C₂.' }] },
  };

  // Các vạch cực quang dùng trong mô phỏng độ cao (alt: độ cao phát xạ, giá trị gần đúng).
  const aurora = [
    { id: 'O-557.7', sp: 'O', group: 'green', alt: '≈ 100–150 km', eye: 1.0 },
    { id: 'O-630.0', sp: 'O', group: 'red', alt: '> 200 km', eye: 0.75 },
    { id: 'O-636.4', sp: 'O', group: 'red', alt: '> 200 km', eye: 0.75 },
    { id: 'N2p-427.8', sp: 'N2p', group: 'violet', alt: '≈ 90–110 km', eye: 0.55 },
    { id: 'N2p-391.4', sp: 'N2p', group: 'violet', alt: '≈ 90–110 km', eye: 0.15 },
  ];

  const terms = {
    photon: 'Hạt ánh sáng: một “gói” năng lượng E = hc/λ. Bước sóng λ quyết định màu.',
    electron: 'Hạt mang điện âm ở lớp vỏ nguyên tử; chỉ được ở những mức năng lượng nhất định.',
    level: 'Các giá trị năng lượng được phép của electron trong nguyên tử; năng lượng bị lượng tử hóa nên electron không thể có giá trị nằm giữa hai mức.',
    ground: 'Mức năng lượng thấp nhất, trạng thái bền của nguyên tử.',
    excited: 'Electron ở mức cao hơn mức cơ bản sau khi nhận năng lượng; trạng thái này không bền.',
    eV: 'Electronvolt, đơn vị năng lượng rất nhỏ: 1 eV = 1,602 × 10⁻¹⁹ J.',
    keV: 'Kilo-electronvolt = 1000 eV, cỡ năng lượng của electron lao vào khí quyển tạo cực quang.',
    wavelength: 'Khoảng cách giữa hai đỉnh sóng ánh sáng. Mắt người thấy được khoảng 380–780 nm.',
    meta: 'Trạng thái kích thích có thời gian sống dài (từ mili-giây tới hàng trăm giây) do chuyển mức về trạng thái thấp hơn bị quy tắc chọn lọc hạn chế; vạch phát ra gọi là vạch cấm.',
    uv: 'Tử ngoại (UV): ánh sáng có λ < 380 nm, mắt người không thấy.',
    ir: 'Hồng ngoại (IR): ánh sáng có λ > 780 nm, mắt người không thấy.',
    solarwind: 'Dòng hạt mang điện (chủ yếu electron và proton) thổi liên tục từ Mặt Trời, tốc độ vài trăm km/s.',
    magnetosphere: 'Vùng không gian quanh Trái Đất do từ trường Trái Đất chi phối; nó chắn phần lớn gió Mặt Trời.',
    fieldline: 'Đường sức từ: hạt mang điện bị “dẫn” đi dọc theo nó, và các đường sức hội tụ về hai cực.',
    thermosphere: 'Tầng khí quyển trên khoảng 85 km, rất loãng. Cực quang xuất hiện ở đây.',
    kp: 'Chỉ số Kp (0–9) đo mức nhiễu loạn của từ trường Trái Đất; Kp càng cao, cực quang càng mạnh và lan xa về phía xích đạo.',
    quench: 'Va chạm làm nguyên tử bị kích thích mất năng lượng trước khi kịp phát sáng (dập tắt do va chạm).',
    spectroscope: 'Kính phân quang: dụng cụ dùng lăng kính hoặc cách tử để tách ánh sáng thành các vạch theo bước sóng.',
    band: 'Phân tử (như CaOH, SrOH) có thêm nhiều mức dao động, nên phát ra cả một dải màu rộng thay vì vạch mảnh.',
    linespec: 'Quang phổ vạch: tập hợp các vạch sáng rời rạc, là “dấu vân tay” riêng của mỗi nguyên tố.',
    nr: 'Chuyển mức không bức xạ: năng lượng bị lấy đi qua va chạm, không tạo ra photon.',
  };

  const quiz = {
    atom: [
      { q: 'Khi electron chuyển từ mức năng lượng cao về mức thấp hơn, nguyên tử sẽ…',
        a: ['hấp thụ một photon', 'phát ra một photon', 'mất đi một proton', 'biến thành nguyên tố khác'], c: 1,
        why: 'Phần năng lượng chênh lệch ΔE được mang đi bởi một photon có λ = hc/ΔE.' },
      { q: 'Hiệu năng lượng ΔE của chuyển mức càng lớn thì photon phát ra có bước sóng…',
        a: ['ngắn hơn (về phía tím, tử ngoại)', 'dài hơn (về phía đỏ, hồng ngoại)', 'không thay đổi', 'bằng 0'], c: 0,
        why: 'λ = hc/ΔE: năng lượng và bước sóng tỉ lệ nghịch.' },
      { q: 'Vạch vàng 589 nm của sodium ứng với ΔE khoảng bao nhiêu?',
        a: ['1,0 eV', '2,1 eV', '3,5 eV', '13,6 eV'], c: 1,
        why: 'ΔE ≈ 1240 / 589 ≈ 2,1 eV, đúng bằng khoảng cách giữa mức 3p và 3s.' },
    ],
    aurora: [
      { q: 'Màu xanh lục phổ biến nhất của cực quang do chất nào phát ra?',
        a: ['Oxygen nguyên tử (557,7 nm)', 'Nitrogen phân tử', 'Hydrogen', 'Sodium'], c: 0,
        why: 'Nguyên tử O chuyển từ trạng thái ¹S về ¹D và phát vạch 557,7 nm, chủ yếu ở độ cao 100–150 km.' },
      { q: 'Khi các hạt từ gió Mặt Trời có năng lượng cao hơn, dải cực quang…',
        a: ['xuống thấp hơn', 'lên cao hơn', 'giữ nguyên độ cao', 'biến mất'], c: 0,
        why: 'Hạt càng nhiều năng lượng càng xuyên sâu vào khí quyển dày đặc trước khi dừng lại.' },
      { q: 'Vì sao vạch đỏ 630 nm chỉ xuất hiện ở trên cao (> 200 km)?',
        a: ['Vì trên cao nhiệt độ cao hơn', 'Vì trạng thái ¹D phải chờ ~110 s; ở thấp nó bị va chạm làm mất năng lượng trước khi kịp phát sáng', 'Vì Mặt Trời có màu đỏ', 'Vì ở dưới thấp không có oxygen'], c: 1,
        why: 'Ở thấp, không khí dày nên nguyên tử bị va chạm liên tục: vạch đỏ bị “dập tắt”. Chỉ ở trên cao, nơi rất loãng, nó mới kịp phát sáng.' },
    ],
    flame: [
      { q: 'Ngọn lửa màu vàng cam rực thường cho thấy có nguyên tố nào?',
        a: ['Sodium (Na)', 'Copper (Cu)', 'Potassium (K)', 'Barium (Ba)'], c: 0,
        why: 'Vạch đôi D 589,0 / 589,6 nm của sodium rất mạnh, chỉ cần một chút muối ăn là lửa đã vàng.' },
      { q: 'Lithium và strontium đều cho lửa màu đỏ. Làm sao phân biệt chắc chắn?',
        a: ['Nhìn kỹ hơn bằng mắt thường', 'Đốt lâu hơn', 'Dùng kính phân quang để so sánh các vạch phổ', 'Đổi sang muối khác'], c: 2,
        why: 'Lithium có một vạch đỏ 670,8 nm gần như đứng một mình; strontium có dải đỏ rộng 640–690 nm kèm vạch lam 460,7 nm.' },
      { q: 'Vì sao mỗi nguyên tố có “dấu vân tay ánh sáng” riêng?',
        a: ['Vì ngọn lửa có nhiều màu', 'Vì mỗi nguyên tố có một bộ mức năng lượng riêng', 'Vì kính phân quang tự tô màu', 'Vì các muối có vị khác nhau'], c: 1,
        why: 'Các khoảng cách ΔE giữa những mức năng lượng là riêng cho từng nguyên tố, nên bộ bước sóng λ = hc/ΔE cũng riêng.' },
    ],
  };

  const tips = {
    atom: [
      'Bấm trực tiếp vào một mức trên sơ đồ để kích thích electron lên đúng mức đó.',
      'Bật “Tự động” để quang phổ được ghi nhận liên tục.',
      'Với oxygen, electron chuyển mức hai lần liên tiếp, phát ra cả photon xanh lục lẫn đỏ.',
      'Photon tử ngoại (UV) và hồng ngoại (IR) được ghi nhận ở hai ô hai đầu thanh phổ, ngoài vùng khả kiến.',
    ],
    aurora: [
      'Giảm năng lượng hạt: hạt dừng lại ở độ cao lớn, nơi oxygen phát vạch đỏ 630 nm.',
      'Bấm vào một dải sáng để xem vạch phổ của nó.',
      'Chuyển sang “Từ mặt đất” để xem cực quang như khi đứng ngắm thật.',
      'Gió Mặt Trời mạnh hơn sẽ ép từ quyển lại gần Trái Đất hơn.',
    ],
    flame: [
      'Kéo lăng kính lên tia sáng, hoặc bấm “Qua kính phân quang”.',
      'Lithium và strontium cùng cho ngọn lửa đỏ nhưng quang phổ khác hẳn. Hãy so sánh.',
      'Thử phân tích “Mẫu chưa biết” để rèn kỹ năng nhận diện quang phổ.',
    ],
  };

  // ---------- Chỉ mục vạch phổ (dựng tự động) ----------
  const index = {};
  const put = (o) => { index[o.id] = Object.assign(index[o.id] || {}, o); };
  const lid = (sp, nm) => sp + '-' + nm.toFixed(1);

  for (const [sid, sp] of Object.entries(species)) {
    sp.id = sid;
    const L = {}; sp.levels.forEach((l) => (L[l.id] = l));
    for (const t of sp.trans) {
      if (t.nr) continue;
      t.id = lid(sid, t.nm);
      put({ id: t.id, sp: sid, nm: t.nm, w: 0, name: t.name, d: t.d, tr: L[t.u].t + ' → ' + L[t.l].t, src: 'NIST' });
    }
  }
  const addFlame = (sid, f) => {
    for (const ln of f.lines) {
      ln.id = lid(sid, ln.nm);
      const base = { id: ln.id, sp: sid, nm: ln.nm, w: ln.w || 0 };
      if (ln.mol) Object.assign(base, { mol: ln.mol, name: 'dải phân tử ' + ln.mol, d: ln.d || 'Dải phát xạ của phân tử ' + ln.mol + ' hình thành trong ngọn lửa.', src: '≈' });
      else if (!index[ln.id]) Object.assign(base, { d: ln.d, src: 'NIST' });
      put(base);
    }
  };
  for (const [sid, f] of Object.entries(flame)) { f.id = sid; addFlame(sid, f); }
  addFlame('fuel', extra.fuel);
  for (const a of aurora) put({ id: a.id, alt: a.alt, aurora: true });

  AL.DATA = {
    species, flame, FLAME_ORDER, extra, aurora, terms, quiz, tips, index,
    line: (id) => index[id],
    sp: (id) => species[id] || extra[id],
    lineId: lid,
  };
})();
