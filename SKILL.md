---
name: gpm-automate
description: Tra cứu tham chiếu action và tạo cấu trúc JSON .gscript / .gpmsln chuẩn xác cho GPM Automate.
---

GPM Automate — Tra cứu & tạo node/file .gscript

Skill gộp: vừa là reference (action, biến, điều kiện, mô hình sản phẩm, Gen AI Workflow) vừa là bộ tạo JSON .gscript paste-ready. Kịch bản GPM Automate là JSON serialize kiểu .NET (Json.NET, khóa $type).

Nguyên tắc cốt lõi:
- Target: Browser automation qua GPM Login profiles (KHÔNG dùng GPM Box).
- Chỉ dùng ĐÚNG các action có trong danh sách dưới đây — không bịa action mới, không đoán type int.
- Chỉ làm việc được với source thô (JSON đọc được). File .gpmlaunch (paid) bị mã hóa → bỏ qua.
- Selector khi cần chính xác (quy tắc bắt buộc): khi phải có XPath chuẩn để chạy thật, mặc định tự mở Claude in Chrome đọc DOM tab thật để dò XPath — TUYỆT ĐỐI không gợi ý người dùng dùng Live mode trong Generate with AI. Chỉ khi không mở được Chrome mới nhờ người dùng dán HTML/XPath. Yêu cầu thiên về dựng khung/logic (chưa chạy thật, chưa mở trang đích) → giữ XPath phỏng đoán + đánh dấu placeholder, không cần mở Chrome.
- Điều kiện kiểm tra element tồn tại → BẮT BUỘC hasElement(XPATH) / !hasElement(XPATH) (xem mục Cú pháp điều kiện). Không viết XPath trần trong condition, không dùng Count element > 0 chỉ để test tồn tại.
- Execute JS code (68) cần TRẢ GIÁ TRỊ ra biến → BẮT BUỘC tự return (GPM không tự thêm; xem mục "Execute JS code (68) — quy tắc return").
- Metadata mặc định (GPM Softwares): tạo project mới thì author_info = "GPM Softwares - gpmsoftwares.com" (trừ khi người dùng chỉ định khác).

⚡ TỐC ĐỘ — SINH bằng Python, SỬA bằng tìm-thay:
Hai chế độ, chọn đúng để nhanh. Ranh giới: tạo mới / regenerate lô = Python; vá lẻ trên file sẵn có = Edit + Grep.

- SINH / dựng lại hàng loạt → Python. Tạo tool mới, hoặc đẻ khối lặp (nhiều node giống nhau, For lồng nhiều bước) → viết 1 script Python (~50–100 dòng, dùng gid()+ri() ở mục "Quy trình dựng") rồi chạy trong shell, ghi thẳng ra src.gscript/info.gpmsln. Python tự lo GUID + escape → nhanh vài giây, không lỗi tay. File kết quả vẫn là JSON thuần, mở Editor bình thường; người dùng KHÔNG cần cài Python — Python chỉ là "khuôn đúc" chạy nền, không phải thứ chạy cùng tool.
- SỬA vài chỗ trên file có sẵn → Edit + Grep, KHÔNG Python. Đổi 1 XPath, tăng timeout, chỉnh comment → Grep nhảy thẳng tới node (dùng comment/xpath làm mỏ neo) rồi Edit thay chuỗi trực tiếp. Lôi Python ra parse–sửa–ghi lại còn chậm hơn.

Đòn bẩy tốc độ khi sửa node/XPath:
- XPath thường xuất hiện 2 chỗ (element_xpath + raw_input khóa XPATH của Mouse click type 48) → thay cả 2 (Edit replace_all) trong 1 lần.
- Cho mỏ neo: người dùng nói kèm comment hoặc XPath hiện tại → Grep 1 phát ra đúng dòng, khỏi đọc cả file ~1200 dòng.
- Gom lô: nhiều sửa trong 1 lượt (đổi 3 xpath + timeout node kia) thay vì mỗi thứ 1 vòng hỏi–đáp.
- Dò XPath thật thì chỉ đích danh 1 element — mở Chrome đọc DOM là bước chậm nhất: find đúng element rồi trả xpath, không chụp màn hình mò.
- Bảng selector (khuyến nghị dài hạn cho tool UI hay đổi như Threads/Facebook): giữ 1 bảng nhãn→xpath ở đầu project hoặc file ghi chú riêng; UI đổi thì sửa 1 chỗ rồi map lại, khỏi lục từng node.

Mô hình sản phẩm:
- GPM Automate Editor — cho người tự viết tool (kéo thả). Free tier xuất ra source folder để tự dùng. Paid tier đóng gói thành .gpmlaunch (mã hóa) để bán trên app.gpmautomate.com hoặc chia sẻ mà không lộ code.
- GPM Automate Runtime — cho người chỉ chạy tool đã có. Miễn phí, không sửa code, nạp .gpmlaunch và chạy trên profile GPM Login.
- GPM Automate còn làm cả automation điện thoại Android (nhóm action Phone).

⭐ CHẾ ĐỘ XUẤT MẶC ĐỊNH = paste-ready clipboard:
Người dùng thường dựng flow trong Editor với 3 block cố định (before browser opened = before_init / main block = main_logic / after browser closed = after_quit) rồi copy–paste từng đoạn node. Yêu cầu điển hình: "xem tab hiện tại, viết block tải video lên đợi up xong" → dựng 1 NormalBlockNode gồm nhiều action phù hợp, không viết cả file.
→ Mặc định xuất đúng format clipboard (dán Ctrl+V vào block đích). Chỉ xuất cả file/project khi được yêu cầu rõ. (Shortcut Editor: Ctrl+C copy, Ctrl+V paste, Del xoá, Ctrl+S save, Ctrl+F find node.)

Format clipboard (xác nhận từ paste thật):
- Top-level luôn là MẢNG [ ... ] — copy 1 action vẫn bọc [].
- Copy 1 block → mảng chứa 1 NormalBlockNode (có nodes[] con). Copy 1 action → mảng chứa 1 ActionNode. Nhiều item cùng cấp → mảng nhiều phần tử.
- Thứ tự field:
  + ActionNode: $type, type, element_xpath, output_variable_name, delay, continue_on_error, id, display_text, raw_input, comment
  + NormalBlockNode: $type, nodes, expanded, continue_on_error, id, display_text, raw_input, comment (block raw_input:null, display_text:"Normal block").
  + ForBlockNode: $type, start, end, step, nodes, expanded, continue_on_error, id, display_text, raw_input, comment (start/end/step trước nodes; ForBlock còn có raw_input chứa [{"Key":"START"},{"Key":"END"},{"Key":"STEP"}] lặp lại giá trị; không dùng output_variable_name cho index).
  + IfBlockNode/ElseIfBlockNode/WhileBlockNode: $type, condition, nodes, expanded, continue_on_error, id, display_text, raw_input, comment (condition trước nodes; raw_input chứa [{"Key":"CONDITION","Value":"<= condition>"}] lặp lại giá trị của field condition; display_text = "If"/"Else if"/"While").
  + ElseBlockNode: $type, nodes, expanded, continue_on_error, id, display_text, raw_input, comment (không có condition; raw_input:null; display_text:"Else" — cùng khuôn NormalBlockNode).
- Escape raw_input: dựng bằng json.dumps ra \" — tương đương serialize của Editor, dán chạy OK (đã kiểm chứng).

VD 1 action paste-ready:
[{"$type":"GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models","type":55,"element_xpath":"//input[@type='file']","output_variable_name":null,"delay":"$delay","continue_on_error":false,"id":"<GUID>","display_text":null,"raw_input":"[{\"Key\":\"FILE_PATH\",\"Value\":\"$videoPath\"}]","comment":"uploading..."}]

Ánh xạ field ↔ Property panel:
comment=ô Note (chỉ hiển thị trong editor, không ảnh hưởng runtime). delay=Delay after completion (ms) (min,max) dạng "2000,3000" hoặc "$delay". continue_on_error=checkbox Continue on error. element_xpath=ô XPath. raw_input TIME_OUT=ô Timeout (s). condition=ô Condition.

Cấu trúc thư mục project (.gpmsln):
Project GPM Automate lưu ra đĩa = 1 thư mục (tên = tên project). 2 file lõi LUÔN có khi lưu từ Editor; các file còn lại chỉ phát sinh theo hành động (không có sẵn khi mới lưu source):
- info.gpmsln — [luôn có] metadata project (JSON 1 dòng hoặc pretty).
- src.gscript — [luôn có] nội dung Editor (JSON, chính là khung Editor bên dưới).
- logo.ico — [tùy chọn] icon project nếu đã đặt logo (file .ico thật trên đĩa; khi đó logo trong info.gpmsln vẫn có thể null).
- src.gpmconfig — [sinh khi CHẠY script] lưu cấu hình chạy (Excel input + custom inputs) của lần chạy. Chỉ chạy source từ folder → mới xuất hiện; project chưa chạy lần nào thì không có file này.
- .build — [sinh khi BUILD .gpmlaunch] manifest đóng gói/license, chỉ tạo lúc build/publish ra .gpmlaunch. Chạy trực tiếp từ source folder → KHÔNG có .build.
→ Khi phân tích/tạo project: chỉ info.gpmsln + src.gscript là cần thiết. Thấy src.gpmconfig = project đã từng chạy; thấy .build = project đã từng build bản đóng gói. Xuất project mới thì chỉ cần tạo 2 file lõi (+ logo.ico nếu có logo); không tự bịa .build/src.gpmconfig.

info.gpmsln mẫu thật:
{"id":"<GUID>","type":"Browser","name":"<tên project = tên thư mục>","description":null,"version":"<build GPM Automate, vd 2807>","password":null,"author_info":"<Anonymous | URL FB/tác giả>","logo":null,"use_license_system":false,"created_at":"<ISO8601 UTC>"}
Ghi chú: type="Browser"; id là GUID project (không liên quan id node); version = build GPM Automate lúc lưu (vd 2708, 2807); author_info có thể là "Anonymous" hoặc link (vd https://www.facebook.com/...); tạo project mới → GUID mới + created_at hiện tại.
Mặc định cho project GPM Softwares: tạo project mới thì author_info = "GPM Softwares - gpmsoftwares.com" (trừ khi người dùng chỉ định khác). Nếu có .build đi kèm thì author_info trong .build cũng để cùng chuỗi này cho khớp.

.build — manifest đóng gói / license (JSON pretty) — CHỈ sinh khi build .gpmlaunch:
Tạo lúc build/publish tool ra .gpmlaunch; mô tả bản đóng gói. KHÁC key với info.gpmsln (dùng tiền tố app_):
{"app_id":"<GUID = info.gpmsln.id>","app_name":"<= project name>","app_password":"","author_info":"<URL/tác giả>","use_license_system":true,"version":"<build, vd 2807>"}
Ghi chú: app_id trùng id của info.gpmsln; app_name trùng name; app_password = mật khẩu mở/bảo vệ tool (thường rỗng); use_license_system/author_info/version khớp info.gpmsln. Không có type/logo/created_at/description. Chạy source folder trực tiếp thì file này không tồn tại.

src.gpmconfig — cấu hình chạy (JSON 1 dòng) — sinh khi CHẠY script:
Lưu tùy chọn "Use input Excel" + Custom inputs của lần chạy (đúng phần Cấu hình chạy ở cuối skill). Chỉ xuất hiện sau khi project được chạy ít nhất 1 lần. Mẫu thật:
{"UseExcel":true,"ExcelFile":"C:\\...\\template.xlsx","ExcelSheetId":0,"ExcelReadType":0,"IsExcelMapWithACol":true,"ExcelIsWriteOKAfterCompleted":false,"ExcelWriteOKColName":"Z","CustomInputs":[]}
Field: UseExcel(bool bật Excel input) · ExcelFile(path tuyệt đối, escape \\) · ExcelSheetId(0-based) · ExcelReadType(int, chế độ đọc all/one row) · IsExcelMapWithACol(bool — map cột A theo profile name) · ExcelIsWriteOKAfterCompleted(bool — ghi 'OK' khi xong) · ExcelWriteOKColName(cột ghi OK, vd "Z") · CustomInputs(mảng input tùy biến, thường []).
Quy tắc đọc dữ liệu Excel: bỏ qua dòng 1 (tiêu đề), đọc dữ liệu từ dòng 2 trở đi; ExcelSheetId 0-based.
2 biến hệ thống chính khi dùng Excel input: $inputExcel[<CỘT>] (lấy giá trị theo tên cột của dòng đang xử lý, vd $inputExcel[B]), $inputExcelTotalRows (tổng số dòng dữ liệu), $inputExcelCurrentRow (index dòng hiện tại).
2 chế độ đọc Excel (ExcelReadType):
- Chế độ 1 — một profile đọc toàn bộ dòng: dùng cho tác vụ kiểu nuôi tài khoản, đăng nhiều bài — 1 profile chạy For từ 0 đến $inputExcelTotalRows, mỗi vòng lặp xử lý 1 dòng dữ liệu khác nhau. Muốn đánh dấu dòng đã xong phải tự viết logic ghi file (không tự động).
- Chế độ 2 — mỗi profile đọc đúng 1 dòng: dùng cho tác vụ kiểu login, đăng ký tài khoản — mỗi lần chạy (mỗi profile) tự map vào đúng 1 dòng dữ liệu, không cần vòng lặp For thủ công.
Cơ chế "Write OK" (ExcelIsWriteOKAfterCompleted + ExcelWriteOKColName): bật lên để tool tự ghi chữ "OK" vào cột chỉ định (vd cột "Z") ngay khi xử lý xong 1 dòng — lần chạy sau tool tự động BỎ QUA các dòng đã có "OK", tránh chạy lặp lại dữ liệu cũ nếu quá trình bị tắt đột ngột giữa chừng.

Khung file đầy đủ (src.gscript):
{ "$type":"GPMAutomateEditor.Models.Editor, GPMAutomateEditor.Models",
  "before_init":{NormalBlockNode}, "main_logic":{NormalBlockNode},
  "after_quit":{NormalBlockNode}, "name":"Main" }
Thứ tự key top-level: $type, before_init, main_logic, after_quit, name. Block rỗng vẫn "nodes":[].

Node:
- Mọi node: id=GUID v4 ngẫu nhiên, duy nhất; tạo mới → GUID mới. continue_on_error(bool), comment, display_text.
- ActionNode: type(int)=mã action; raw_input là CHUỖI JSON escape chứa [{"Key":..,"Value":..}] (không tham số → "[]"); element_xpath (một số action để XPath ở đây, số khác trong raw_input); output_variable_name KHÔNG kèm $; delay=""|"min,max"(ms)|"$delay".
- Block (có nodes[]+expanded): NormalBlockNode; IfBlockNode/ElseIfBlockNode(+condition); ElseBlockNode; ForBlockNode(+start,end,step); While. Else/ElseIf ngay sau If cùng mảng cha.

Set variable — 4 kiểu Input (USER_INPUT_TYPE):
Text, File (trả path tuyệt đối — cho File upload), Checkbox (True/False), ComboBox (chọn 1 từ COMBOBOX_DATA). Keys: VALUE, ALLOW_USER_INPUT, USER_INPUT_TYPE, COMBOBOX_DATA, INPUT_REQUIRED.

Danh sách Action đầy đủ (V3) — tên khái niệm:
- Mouse, Keyboard, Scroll: Mouse click, Mouse try to click, Mouse move, Mouse press and hold, Mouse release, Mouse scroll, Random scroll, Scroll to top, Scroll to bottom, Scroll to element, Key press, File upload, Select dropdown
- Text & Number: Random text, Split text, Read json, Regex, Random number, Math execute, 2FA code
- Clipboard: Get clipboard text, Set clipboard text
- File & Folder: File exists, Copy file, Move/rename file, Delete file, File read all text, File read all lines, File read random line, File write all text, File append line, Folder exists, Create folder, Move/rename folder, Delete folder, Folder get file list, Create empty excel, Read excel file, Write excel file, Append excel file
- Google Service: Read google sheet, Write google sheet
- HTTP, Image, AI, Mail: HTTP Request, HTTP Download, Wait to image, Image exists, Image search, Image to Base64, ChatGPT, DeepSeek, Read mail code, Read outlook (Oauth2)
- Cookie: Import cookie, Export cookie
- Block & Workflow control: Normal block, For, While, If, Else if, Else, Set variable, Increase variable, Decrease variable, Count, Exit loop, Next loop, Stop, Throw, Delay, Call workflow
- Navigation, Element, Tab/Popup, Alert: New tab, Active tab, Close tab, Close all tab, Go to URL, Back URL, Reload, Get URL, Wait URL Changed, Wait element, Get element attribute, Get element text, Count element, Switch to default, Switch to frame, Switch to popup, Wait popup, Has popup, Accept alert, Cancel alert
- Javascript: Execute JS code, Get extension id, Screenshot
- Phone (Android): phone-app, phone-device, phone-navigation, phone-file, phone-clipboard, phone-action, phone-element, phone-shell

Bảng mã action (type int) — xác nhận từ file thật + Editor:
1 Set variable: VALUE, ALLOW_USER_INPUT, USER_INPUT_TYPE, COMBOBOX_DATA, INPUT_REQUIRED (đọc Excel: VALUE=$inputExcel[B])
2 Increase variable: CURRENT_VAL, INCREASE_BY (outvar = biến tăng)
3 Decrease variable: CURRENT_VAL, DESCREASE_BY (⚠️ field viết SAI CHÍNH TẢ thật trong sản phẩm: là DESCREASE_BY chứ KHÔNG PHẢI DECREASE_BY)
4 Count: INPUT_ARRAY (đếm phần tử mảng/biến)
5 Exit loop: thoát vòng lặp
6 Next loop: nhảy qua vòng lặp kế
7 Delay: MIN, MAX (đơn vị ms)
8 Random text: TEXT_LEN (độ dài chuỗi random, có thể là $len)
9 Split text: INPUT_TEXT, SPLIT_CHAR
10 Read json: JSON, NODES (vd [$loopIndex].keyword)
11 Random number: MIN, MAX
12 Math execute: MATH_EXPRESSION (vd 1+2*3/4)
13 File exists: FILE_PATH (outvar = true/false chữ thường)
14 Copy file: SOURCE_FILE, DES_FILE
15 Move / rename file: SOURCE_FILE, DES_FILE (chú ý khi khác ổ đĩa)
16 Delete file: FILE_PATH
17 File read all text: FILE_PATH (outvar = toàn bộ nội dung)
18 File read all lines: FILE_PATH (outvar = mảng từng dòng)
19 File write all text: FILE_PATH, TEXT (ghi đè toàn bộ)
20 File append line: FILE_PATH, TEXT (nối thêm 1 dòng)
21 Read excel file: FILE_PATH, SHEET_ID, COL_NAME_OR_INDEX, ROW_INDEX (SHEET_ID 0-based)
22 Write excel file: FILE_PATH, SHEET_ID, COL_NAME_OR_INDEX, ROW_INDEX, DATA (ROW_INDEX tường minh)
23 Folder exists: FOLDER_PATH
24 Create folder: FOLDER_PATH
25 Delete folder: FOLDER_PATH
26 Move / rename folder: SOURCE_FOLDER, DES_FOLDER
27 Get clipboard text: outvar = nội dung clipboard OS
28 Set clipboard text: TEXT
29 HTTP Request: URL, METHOD, HEADER, DATA, USE_PROFILE_PROXY (HEADER dạng "key:value" từng dòng; USE_PROFILE_PROXY là "True"/"False")
30 HTTP Download: URL, SAVE_PATH, HEADER
34 Chat GPT: API, MODEL, PROMPT (chuẩn OpenAI api.openai.com/v1/chat/completions)
35 Read mail code: USERNAME, PASSWORD, MAIL_SERVER, FROM_CONTAINS, CODE_TYPE, CODE_LEN, ELE_XPATH, ELE_ATTR, PROXY (IMAP)
36 New tab: mở tab mới
37 Active tab: ACTIVE_TAB_TYPE (BY_INDEX | BY_PREFIX_URL), TAB_INDEX_OR_PREFIX_URL
38 Close tab: đóng tab hiện tại
39 Go to URL: URL, TIME_OUT
40 Back URL: browser back
41 Reload: tải lại trang
42 Get URL: outvar = URL hiện tại
43 Wait URL Changed: CURRENT_URL, TIME_OUT
44 Wait element: TIME_OUT (XPath ở element_xpath)
45 Get element attribute: ATTR_NAME (XPath ở element_xpath)
46 Get element text: XPath ở element_xpath, outvar = text content
47 Count element: XPath ở element_xpath, outvar = số lượng phần tử
48 Mouse click: CLICK_TYPE, XPATH, POS (CLICK_XPATH hoặc CLICK_POS dạng "x,y")
50 Mouse move: MOVE_TYPE (MOVE_XPATH | MOVE_POS), XPATH, POS
51 Mouse press and hold: (raw_input "[]", giữ chuột tại element_xpath, delay = thời gian giữ)
52 Mouse release: (raw_input null, nhả chuột)
53 Mouse scroll: SCROLL_NUM (1=xuống 1 lần, -1=lên 1 lần)
54 Key press: TYPE, KEY, DELAY_PRESS (KEY vd Enter, Control+A+Backspace)
55 File upload: FILE_PATH (XPath ở element_xpath, vd //input[@type='file'])
57 Random scroll: cuộn ngẫu nhiên
58 Scroll to top: cuộn lên đầu
59 Scroll to bottom: cuộn xuống đáy
60 Scroll to element: XPath ở element_xpath
61 Switch to default: thoát frame về trang chính
62 Switch to frame: XPath iframe ở element_xpath
63 Switch to popup: TITLE
64 Import cookie: FILE_PATH
65 Export cookie: FILE_PATH
66 Accept alert: chấp nhận alert/confirm JS
67 Cancel alert: hủy alert/confirm JS
68 Execute JS code: FILE_OR_CODE (GPM KHÔNG tự thêm return. Trả biến BẮT BUỘC có return)
69 Get extension id: EXT_NAME (outvar = ID 32 ký tự của extension)
71 Append excel file: FILE_PATH, SHEET_ID, COL_NAME_OR_INDEX, DATA (tự ghi dòng trống tiếp theo)
72 Folder get file list: FOLDER_PATH (outvar = mảng đường dẫn file)
73 Close all tab: đóng toàn bộ tab
74 Create empty excel: FILE_PATH
75 File read random line: FILE_PATH
76 Stop: dừng flow lập tức không báo lỗi
77 DeepSeek: API, MODEL, PROMPT (chuẩn OpenAI api.deepseek.com/chat/completions)
78 Read google sheet: CRE_FILE, FILE_ID, SHEET_INDEX, COL_NAME, ROW_INDEX
79 Write google sheet: CRE_FILE, FILE_ID, SHEET_INDEX, COL_NAME, ROW_INDEX, DATA
80 Read outlook (Oauth2): DATA, FROM_CONTAINS, CODE_TYPE, CODE_LEN, ELE_XPATH, ELE_ATTR, PROXY (DATA: email|password|refresh_token|client_id)
81 2FA code: SECRETE_KEY (⚠️ field viết SAI CHÍNH TẢ là SECRETE_KEY, chuẩn TOTP 6 số)
82 Regex: TEXT, REGEX (.NET regex, lấy match đầu tiên)
116 Screenshot: OUTPUT_PATH, FILE_NAME, FULL_PAGE ("True"/"False")
117 Throw: MESSAGE (dừng và báo lỗi)
118 Wait popup: TITLE_CONTAINS, TIMEOUT
119 Has popup: TITLE_CONTAINS (outvar = bool)

⚠️ Phân biệt Has popup / Wait popup / Switch to popup (118/119/63) với JS alert:
"Popup" ở đây là cửa sổ/tab trình duyệt MỚI THẬT (vd popup MetaMask), khớp theo title — KHÔNG PHẢI JS alert()/confirm()/prompt(). Sau khi Switch to popup (63) có thể Mouse click bằng XPath bình thường. Nhóm Accept/Cancel alert (66/67) mới là JS dialog nguyên bản.

CODE_TYPE (dùng trong action 35 và 80):
- "Full" — trả nguyên văn bản/HTML nội dung mail.
- "Number" — trích dãy số liên tiếp đúng độ dài CODE_LEN.
- "Text" — chạy XPath (ELE_XPATH) lên HTML của mail, trích theo ELE_ATTR ("text" hoặc tên attribute).

⚠️ Execute JS code (68) — quy tắc return:
GPM chạy kiểu executeScript và KHÔNG tự thêm return:
A. Cần TRẢ GIÁ TRỊ ra biến: BẮT BUỘC tự viết return (vd: return "$keyword".toLowerCase(); return new Date().toLocaleString("vi-VN"); return "$groupUrl".replace(/\/+$/,"") + "/search/?q=" + encodeURIComponent("$keyword"); return "$rawPhone".replace(/[^0-9]/g,"").replace(/^84(\d{9})$/,"0$1"); return (document.querySelector("<CSS>")||{innerText:""}).innerText; hoặc function A(){ ... return p; } return A();).
B. Chỉ THỰC HIỆN HÀNH ĐỘNG (click, setAttribute, scroll...): KHÔNG cần return.
TUYỆT ĐỐI KHÔNG dùng IIFE (function(){...})() để lấy giá trị vì outvar sẽ về RỖNG.

Biến hệ thống:
- Profile: $profileId, $profileName, $profileProxy
- Vòng lặp: $loopIndex
- Excel input: $inputExcel, $inputExcel[<CỘT>], $inputExcelFileLocation, $inputExcelTotalRows, $inputExcelCurrentRow

Cú pháp điều kiện (If / Else if / While):
- Chuỗi bọc "" (vd $name = "admin"); số ghi thẳng.
- Toán tử: > < >= <= = !=.
- Chuỗi: contains, !contains. Chú ý: !contains kết hợp &&/|| dễ lỗi parser Unexpected token '!' → ưu tiên dùng contains dương + lồng If/Else.
- Kiểm tra element tồn tại: BẮT BUỘC dùng hasElement(XPATH) / !hasElement(XPATH). XPath không bọc "". Phủ định là !hasElement(...), KHÔNG dùng hasElement(...) = false. TUYỆT ĐỐI KHÔNG viết XPath trần hoặc đếm Count > 0 để test tồn tại.
- Ghép: && (ưu tiên hơn), ||, () nhóm lại.
- ElseIf/Else phải là SIBLING cùng cấp nằm ngay sau If trong mảng nodes cha (KHÔNG lồng vào trong If).

Ví dụ paste-ready If / ElseIf / Else + While:
[
  {"$type":"GPMAutomateEditor.Models.IfBlockNode, GPMAutomateEditor.Models","condition":"$x = 1","nodes":[{"$type":"GPMAutomateEditor.Models.ActionNode, GPMAutomateEditor.Models","type":1,"element_xpath":null,"output_variable_name":"result","delay":"0,0","continue_on_error":false,"id":"<GUID>","display_text":"Set variable","raw_input":"[{\"Key\":\"VALUE\",\"Value\":\"A\"},{\"Key\":\"ALLOW_USER_INPUT\",\"Value\":\"False\"},{\"Key\":\"USER_INPUT_TYPE\",\"Value\":\"Text\"},{\"Key\":\"COMBOBOX_DATA\",\"Value\":\"\"},{\"Key\":\"INPUT_REQUIRED\",\"Value\":\"False\"}]","comment":null}],"expanded":false,"continue_on_error":false,"id":"<GUID>","display_text":"If","raw_input":"[{\"Key\":\"CONDITION\",\"Value\":\"$x = 1\"}]","comment":null},
  {"$type":"GPMAutomateEditor.Models.ElseIfBlockNode, GPMAutomateEditor.Models","condition":"$x = 2","nodes":[],"expanded":false,"continue_on_error":false,"id":"<GUID>","display_text":"Else if","raw_input":"[{\"Key\":\"CONDITION\",\"Value\":\"$x = 2\"}]","comment":null},
  {"$type":"GPMAutomateEditor.Models.ElseBlockNode, GPMAutomateEditor.Models","nodes":[],"expanded":false,"continue_on_error":false,"id":"<GUID>","display_text":"Else","raw_input":null,"comment":null},
  {"$type":"GPMAutomateEditor.Models.WhileBlockNode, GPMAutomateEditor.Models","condition":"hasElement(//div[@role='feed']//div[@role='article'][not(@data-seen)])","nodes":[],"expanded":true,"continue_on_error":false,"id":"<GUID>","display_text":"While","raw_input":"[{\"Key\":\"CONDITION\",\"Value\":\"hasElement(//div[@role='feed']//div[@role='article'][not(@data-seen)])\"}]","comment":"lặp tới khi hết bài chưa đánh dấu"}
]

Quy ước đặt tên & Comment:
- Biến: camelCase (keywordsPath, timeToWatch, videoIndex, videoPath); biến đơn dùng lowercase (delay, keyword, link, title).
- Comment đầu vào before_init: Tiếng Việt, hướng dẫn chi tiết (vd: Thời gian xem video -> điền 60000,80000).
- Comment bước chạy main: Tiếng Anh ngắn, lowercase (vd: go to url, wait element, click submit).

Bóc tách trang ẢO HÓA DOM (Facebook, feed vô hạn):
- Trang ảo hóa chỉ giữ vài phần tử trong DOM, cuộn sẽ hủy phần tử cũ. KHÔNG đếm toàn bộ rồi lặp theo index.
- Giải pháp: Dùng JS đánh dấu trực tiếp lên DOM (setAttribute("data-seen","1")) và cờ tạm (data-cur="1").
- Dùng vòng lặp While với condition: hasElement(//div[@role='feed']//div[@role='article'][not(@data-seen)]).
- Thao tác bóc dữ liệu qua XPath [@data-cur='1'], sau đó cuộn trang nạp thêm.

Quy trình dựng (Python):
- gid() = str(uuid.uuid4()); ri(pairs) = json.dumps([{"Key":k,"Value":v}...], ensure_ascii=False).
- Dựng node theo bảng + đúng thứ tự field. Mặc định bọc mảng [] để dán clipboard.
- Khi cần tạo project: chỉ tạo info.gpmsln + src.gscript (không tự tạo .build và src.gpmconfig). Mặc định author_info = "GPM Softwares - gpmsoftwares.com".
- Validate: id phải là duy nhất, raw_input escape chuẩn JSON, Execute JS có return nếu gán biến, điều kiện tồn tại dùng hasElement.

Gotchas thực chiến:
- Quên escape chuỗi raw_input -> lỗi paste/mở file.
- Execute JS (68) quên return -> biến nhận giá trị rỗng.
- Viết XPath trần trong If/While -> lỗi cú pháp condition (phải bọc trong hasElement()).
- !contains kết hợp logic ghép &&/|| dễ lỗi parser -> đảo nhánh If/Else dùng contains khẳng định.
- File exists (13) trả về "true"/"false" chữ thường.
- contains phân biệt hoa thường -> dùng JS toLowerCase() cả 2 vế trước khi so sánh.
- XPath tự sinh chỉ là phỏng đoán nếu chưa có DOM thực tế.

Docs chính thức & tham khảo:
- docs.gpmautomate.com
- github.com/hiimmaxx7/automate