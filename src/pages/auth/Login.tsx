import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Circle,
  Eye,
  EyeOff,
  Leaf,
  Lock,
  Mail,
  ShieldCheck,
  HelpCircle,
  Send,
  X,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { appealAccountLockApi } from "../../services/admin.api";

const PRESET_APPEAL_QUESTIONS = [
  "Tôi không vi phạm quy tắc cộng đồng ReUse Hub, đề nghị kiểm tra lại lý do khóa.",
  "Tôi đã hoàn tất đơn hàng và trả đồ đúng hạn, tại sao tài khoản bị tạm ngưng?",
  "Tài khoản của tôi có dấu hiệu bị nghi ngờ đăng nhập bất thường không?",
  "Tôi muốn cập nhật bổ sung giấy tờ định danh KYC để mở khóa tài khoản.",
  "Tôi muốn đối soát lại tranh chấp hoặc khoản ký quỹ đơn hàng của mình.",
  "Khác: Tôi muốn gửi giải trình trực tiếp cho Ban Quản Trị xem xét...",
];

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập email")
    .email("Email không hợp lệ"),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu")
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  const redirectMessage = searchParams.get("message");

  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Account Locked & Appeal State
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [lockedAccountInfo, setLockedAccountInfo] = useState<{
    email: string;
    fullName?: string;
    lockReason?: string;
    lockAppeal?: Record<string, unknown> | null;
  } | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState(PRESET_APPEAL_QUESTIONS[0]);
  const [appealDetails, setAppealDetails] = useState("");
  const [isSendingAppeal, setIsSendingAppeal] = useState(false);
  const [appealSuccess, setAppealSuccess] = useState(false);
  const [appealError, setAppealError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError("");
    setLoginSuccess(false);

    try {
      const user = await login(data);

      setLoginSuccess(true);

      if (user.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (user.role === "SHOP_OWNER") {
        navigate("/shop/dashboard");
      } else {
        const dest = redirectUrl && redirectUrl !== "/" ? redirectUrl : "/user/dashboard";
        navigate(dest);
      }
    } catch (err: unknown) {
      const errObj = err as {
        response?: {
          status?: number;
          data?: {
            errorCode?: string;
            message?: string;
            data?: {
              email?: string;
              fullName?: string;
              lockReason?: string;
              lockedAt?: string;
              lockAppeal?: Record<string, unknown> | null;
              isLocked?: boolean;
            };
          };
        };
        message?: string;
      };
      const resData = errObj?.response?.data;
      if (resData?.errorCode === "ACCOUNT_LOCKED" || resData?.data?.isLocked) {
        setLockedAccountInfo({
          email: resData?.data?.email || data.email,
          fullName: resData?.data?.fullName || "",
          lockReason: resData?.data?.lockReason || resData?.message || "Tài khoản bị tạm khóa để kiểm tra bảo mật hoặc rà soát giao dịch",
          lockAppeal: resData?.data?.lockAppeal || null,
        });
        setSelectedQuestion(PRESET_APPEAL_QUESTIONS[0]);
        setAppealDetails("");
        setAppealSuccess(false);
        setAppealError("");
        setShowLockedModal(true);
      } else {
        setApiError(resData?.message || "Email hoặc mật khẩu không chính xác.");
      }
    }
  };


  return (
    <main className="min-h-screen bg-[#fdf9f2] px-6 py-12 text-[#1c1c18]">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center">
        <div className="grid min-h-[680px] w-full grid-cols-1 overflow-hidden rounded-xl bg-white shadow-xl lg:grid-cols-12">

          {/* Left column */}
          <section className="relative flex flex-col justify-between overflow-hidden bg-[#f7f3ec] p-8 lg:col-span-5 lg:p-12">
            <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#d8e3ce]/40 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-[#f0e0cb]/50 blur-2xl" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded bg-[#f1ede6] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#4a463f]">
                  <Circle className="h-1.5 w-1.5 fill-current" />
                  Circular Fashion Archive 108
                </span>

                <span className="text-[11px] uppercase tracking-wider text-[#4a463f]">
                  Quy Trình Chăm Sóc & Bảo Quản
                </span>
              </div>

              <div className="pt-6">
                <h2 className="font-serif text-[28px] font-medium leading-tight text-[#141310]">
                  A circular wardrobe for timeless style.
                </h2>

                <p className="mt-4 text-sm leading-relaxed text-[#4a463f]">
                  Chuyển từ tiêu dùng nhanh sang quản lý thời trang bền vững, ReUse Hub kéo dài vòng đời trang phục thông qua các giao thức giặt sấy, bảo quản được duy trì nghiêm ngặt, giảm thiểu tác động đến môi trường.
                </p>
              </div>
            </div>

            <div className="relative z-10 my-8">
              <div className="relative h-56 w-full overflow-hidden rounded-lg bg-[#ebe8e1] shadow-md">
                <img
                  className="h-full w-full object-cover"
                  src="./src/assets/images/login.jpg"
                  alt="Curated restored vintage items"
                />

                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-4">
                  <div className="flex items-center gap-2 text-white">
                    <ShieldCheck className="h-4 w-4" />

                    <span className="text-[11px] uppercase tracking-wider">
                      Phong Cách Tuần Hoàn #RH-7740
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 space-y-3">
              <div className="flex items-start gap-3 rounded-lg bg-[#f1ede6]/70 p-4 backdrop-blur-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d8e3ce] text-[#3f4a3a]">
                  <Leaf className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-base font-semibold">
                    Tiết kiệm 4,2 kg CO₂
                  </p>

                  <p className="text-xs leading-relaxed text-[#4a463f]">
                    Tính toán dựa trên mỗi lần thuê trang phục so với sản xuất sản phẩm mới
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between px-1 text-[11px] uppercase tracking-wider text-[#4a463f]">
                <span>Chỉ số tuần hoàn: 98,4%</span>
                <span>Kiểm toán 2026</span>
              </div>
            </div>
          </section>

          {/* Right column */}
          <section className="flex flex-col justify-between bg-white p-8 lg:col-span-7 lg:p-14">
            <div>
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-[#141310] text-white">
                    <span className="text-base">∞</span>
                  </div>

                  <span className="text-lg font-bold uppercase tracking-tight">
                    ReUse Hub
                  </span>
                </div>

                <span className="rounded bg-[#f7f3ec] px-2.5 py-1 text-[11px] uppercase tracking-wider text-[#4a463f]">
                  Truy Cập Cổng
                </span>
              </div>

              <div className="mb-8">
                <h1 className="font-serif text-[28px] font-medium text-[#1c1c18]">
                  Chào mừng trở lại
                </h1>

                <p className="mt-1.5 text-sm leading-relaxed text-[#4a463f]">
                 Vui lòng nhập thông tin đăng nhập để truy cập tài khoản và tủ đồ tuần hoàn của bạn.
                </p>
              </div>

              {/* Redirect Notice */}
              {redirectMessage && (
                <div className="mb-6 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4 text-amber-900 shadow-xs">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-wider text-amber-800">Yêu cầu đăng nhập</p>
                    <p className="mt-0.5 text-xs text-amber-900 leading-relaxed">{redirectMessage}</p>
                  </div>
                </div>
              )}

              {/* API error */}
              {apiError && (
                <div className="mb-6 flex items-start gap-3 rounded-lg bg-[#ffdad6] p-4 text-[#93000a]">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                  <div>
                    <p className="font-semibold">Xác thực thất bại</p>

                    <p className="mt-1 text-xs">
                      {apiError}
                    </p>
                  </div>
                </div>
              )}

              {/* Success */}
              {loginSuccess && (
                <div className="mb-6 flex items-start gap-3 rounded-lg bg-[#d8e3ce] p-4 text-[#3f4a3a]">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />

                  <div>
                    <p className="font-semibold">Đăng nhập thành công</p>

                    <p className="mt-1 text-xs">
                      Đăng nhập thành công. Đang chuyển đến trang của bạn...
                    </p>
                  </div>
                </div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
                noValidate
              >
                {/* Email */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      htmlFor="email"
                      className="text-[13px] font-medium text-[#1c1c18]"
                    >
                      Địa chỉ Email
                    </label>

                    {errors.email && (
                      <span className="text-[11px] font-semibold text-[#ba1a1a]">
                        {errors.email.message}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#4a463f]">
                      <Mail className="h-4.5 w-4.5" />
                    </div>

                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="shopowner@reuse.vn hoặc admin@reuse.vn"
                      {...register("email")}
                      className={`w-full rounded bg-[#f7f3ec] py-3 pl-10 pr-4 text-sm text-[#1c1c18] outline-none transition-all placeholder:text-[#4a463f]/60 focus:bg-white focus:ring-1 ${errors.email
                        ? "ring-1 ring-[#ba1a1a]"
                        : "focus:ring-[#141310]"
                        }`}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-[13px] font-medium text-[#1c1c18]"
                    >
                      Mật Khẩu
                    </label>

                    {errors.password && (
                      <span className="text-[11px] font-semibold text-[#ba1a1a]">
                        {errors.password.message}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#4a463f]">
                      <Lock className="h-4.5 w-4.5" />
                    </div>

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      {...register("password")}
                      className={`w-full rounded bg-[#f7f3ec] py-3 pl-10 pr-12 text-sm text-[#1c1c18] outline-none transition-all placeholder:text-[#4a463f]/60 focus:bg-white focus:ring-1 ${errors.password
                        ? "ring-1 ring-[#ba1a1a]"
                        : "focus:ring-[#141310]"
                        }`}
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? "Ẩn mật khẩu"
                          : "Hiển thị mật khẩu"
                      }
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#4a463f] transition-colors hover:text-[#141310]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Options */}
                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer accent-black"
                    />

                    <span className="text-xs text-[#1c1c18]">
                      Ghi nhớ đăng nhập
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-[13px] font-medium text-[#576151] underline decoration-[#576151]/40 underline-offset-4 transition-colors hover:text-[#141310]"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                {/* Submit */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded bg-[#141310] px-6 py-3.5 text-[13px] font-medium uppercase tracking-wider text-white shadow-sm transition-all duration-200 hover:bg-[#4a463f] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Đang đăng nhập...</span>
                      </>
                    ) : (
                      <>
                        <span>Đăng Nhập</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-[#e6e2db] pt-8 sm:flex-row">
              <p className="text-sm text-[#4a463f]">
                Chưa có tài khoản?

                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="ml-1 font-semibold text-[#141310] hover:underline"
                >
                  Đăng ký ngay
                </button>
              </p>

              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#4a463f]">
                <span className="h-2 w-2 rounded-full bg-[#576151]" />
                <span>Phiên Được Mã Hóa</span>
              </div>
            </div>
          </section>
        </div>
      </div>
      {/* MODAL THÔNG BÁO TÀI KHOẢN BỊ KHÓA & FORM ĐỀ NGHỊ ADMIN MỞ KHÓA */}
      {showLockedModal && lockedAccountInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl rounded-2xl bg-[#fdf9f2] p-6 sm:p-8 shadow-2xl border border-[#ccc5bc]/50 text-[#1c1c18]">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowLockedModal(false)}
              className="absolute right-5 top-5 p-1 rounded-full bg-[#f1ede6] hover:bg-[#e6e2db] text-[#4a463f] hover:text-[#1c1c18] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header Alert */}
            <div className="flex items-start gap-4 pb-5 border-b border-[#ccc5bc]/30">
              <div className="w-12 h-12 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#ffdad6] text-[#ba1a1a]">
                  TÀI KHOẢN ĐANG BỊ TẠM KHÓA
                </span>
                <h3 className="font-serif text-xl font-bold text-[#141310] mt-1">
                  Thông Báo Tạm Ngưng Quyền Truy Cập
                </h3>
                <p className="text-xs text-[#7b766f] mt-0.5">
                  Tài khoản <strong className="text-[#1c1c18]">{lockedAccountInfo.email}</strong> hiện không thể đăng nhập.
                </p>
              </div>
            </div>

            {/* Lý do bị khóa từ Quản Trị Viên */}
            <div className="my-4 p-4 rounded-xl bg-white border border-[#ccc5bc]/40 space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#7b766f]">
                Lý Do Tạm Khóa Ghi Nhận Trong Hệ Thống:
              </div>
              <p className="text-sm font-semibold text-[#ba1a1a] leading-relaxed">
                "{lockedAccountInfo.lockReason}"
              </p>
              <div className="text-[11px] text-[#7b766f] pt-1">
                Quản trị viên đã tạm phong tỏa tài khoản để bảo vệ quyền lợi giao dịch và tính minh bạch của sàn ReUse Hub.
              </div>
            </div>

            {/* Form đề nghị xem xét mở khóa */}
            {appealSuccess ? (
              <div className="p-5 rounded-xl bg-[#d8e3ce]/60 border border-[#bfcab6] text-center space-y-3 my-2">
                <div className="w-10 h-10 rounded-full bg-[#576151] text-white flex items-center justify-center mx-auto">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h4 className="font-serif text-base font-bold text-[#2e352b]">
                  Đã Gửi Đề Nghị Xem Xét Mở Khóa Thành Công!
                </h4>
                <p className="text-xs text-[#4a463f] leading-relaxed max-w-md mx-auto">
                  Ban Quản Trị đã nhận được câu hỏi và lời giải trình của bạn. Sau khi kiểm tra đối soát, chúng tôi sẽ cập nhật trạng thái và <strong>gửi thông báo kèm phản hồi chi tiết về Gmail của bạn ({lockedAccountInfo.email})</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setShowLockedModal(false)}
                  className="mt-2 px-5 py-2 rounded-lg bg-[#141310] text-[#fdf9f2] text-xs font-semibold hover:bg-[#292724] transition-colors"
                >
                  Đã Hiểu &amp; Đóng
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSendingAppeal(true);
                  setAppealError("");
                  try {
                    await appealAccountLockApi({
                      email: lockedAccountInfo.email,
                      question: selectedQuestion,
                      details: appealDetails,
                    });
                    setAppealSuccess(true);
                  } catch (err: unknown) {
                    const errObj = err as { response?: { data?: { message?: string } }; message?: string };
                    setAppealError(errObj?.response?.data?.message || errObj?.message || "Không thể gửi đề nghị mở khóa. Vui lòng thử lại!");
                  } finally {
                    setIsSendingAppeal(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-[#141310] mb-1.5 flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-[#576151]" />
                    <span>Chọn câu hỏi để hỏi lý do &amp; đề nghị Admin xem xét mở khóa:</span>
                  </label>
                  <select
                    value={selectedQuestion}
                    onChange={(e) => setSelectedQuestion(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white text-[#1c1c18] text-xs border border-[#ccc5bc]/50 focus:outline-none focus:ring-1 focus:ring-[#141310] shadow-sm cursor-pointer"
                  >
                    {PRESET_APPEAL_QUESTIONS.map((q, idx) => (
                      <option key={idx} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4a463f] mb-1.5">
                    Lời nhắn / Thông tin giải trình bổ sung cho Quản trị viên (tùy chọn):
                  </label>
                  <textarea
                    rows={3}
                    value={appealDetails}
                    onChange={(e) => setAppealDetails(e.target.value)}
                    placeholder="Nhập thông tin xác thực, mã đơn hàng liên quan hoặc cam kết tuân thủ quy tắc của bạn..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white text-[#1c1c18] text-xs border border-[#ccc5bc]/50 focus:outline-none focus:ring-1 focus:ring-[#141310] shadow-sm placeholder:text-[#7b766f]"
                  />
                </div>

                {appealError && (
                  <div className="p-3 rounded-lg bg-[#ffdad6] text-[#ba1a1a] text-xs font-medium">
                    {appealError}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLockedModal(false)}
                    className="px-4 py-2.5 rounded-lg bg-[#f1ede6] hover:bg-[#e6e2db] text-[#1c1c18] text-xs font-semibold transition-colors"
                  >
                    Hủy Bỏ
                  </button>

                  <button
                    type="submit"
                    disabled={isSendingAppeal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#141310] hover:bg-[#292724] text-[#fdf9f2] text-xs font-semibold shadow-sm transition-all disabled:opacity-60"
                  >
                    {isSendingAppeal ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Đang gửi đề nghị...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Gửi Đề Nghị Admin Xem Xét</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default Login;