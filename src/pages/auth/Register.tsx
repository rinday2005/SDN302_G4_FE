import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import axios from "axios";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Leaf,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { registerApi } from "../../services/auth.api";

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Vui lòng nhập họ tên")
      .min(2, "Họ tên phải có ít nhất 2 ký tự"),

    email: z
      .string()
      .min(1, "Vui lòng nhập email")
      .email("Email không hợp lệ"),

    phoneNumber: z.string().optional().or(z.literal("")),

    password: z
      .string()
      .min(1, "Vui lòng nhập mật khẩu")
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),

    confirmPassword: z
      .string()
      .min(1, "Vui lòng xác nhận mật khẩu"),

    role: z.enum(["USER", "SHOP_OWNER"]),

    agreement: z.boolean().refine((value) => value, {
      message: "Bạn phải đồng ý với điều khoản để tiếp tục",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "USER",
      agreement: false,
    },
  });

  const password = useWatch({ control, name: "password", defaultValue: "" });

  const getPasswordStrength = () => {
    if (!password) {
      return {
        label: "Tối thiểu 6 ký tự",
        level: 0,
      };
    }

    if (password.length < 6) {
      return {
        label: "Yếu",
        level: 1,
      };
    }

    if (password.length < 10) {
      return {
        label: "Tốt",
        level: 2,
      };
    }

    return {
      label: "Mạnh",
      level: 3,
    };
  };

  const passwordStrength = getPasswordStrength();

  const onSubmit = async (data: RegisterFormData) => {
    setApiError("");
    setRegisterSuccess(false);

    try {
      await registerApi({
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber || undefined,
        password: data.password,
        role: data.role,
      });

      setRegisterSuccess(true);

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error: unknown) {
  if (axios.isAxiosError(error)) {
    const errorCode = error.response?.data?.errorCode;

    if (errorCode === "EMAIL_ALREADY_EXISTS") {
      setError("email", {
        type: "server",
        message: "Email này đã được đăng ký.",
      });

      return;
    }
  }

  setApiError("Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
}
  };

  return (
    <main className="min-h-screen bg-[#fdf9f2] px-6 py-12 text-[#1c1c18]">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center">
        <div className="grid w-full grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-12">

          {/* Left column */}
          <section className="flex flex-col justify-between rounded-xl bg-[#f7f3ec] p-8 shadow-sm md:p-10 lg:col-span-5">
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[#576151]">
                <Leaf className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-widest">
                  SỔ TAY THỜI TRANG TUẦN HOÀN
                </span>
              </div>

              <div>
                <h2 className="font-serif text-[28px] font-medium leading-tight text-[#141310]">
                  Elevating style, sharing fashion.
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-[#4a463f]">
                  Mỗi thành viên đăng ký sẽ được tiếp cận bộ sưu tập trang
                  phục thiết kế, phụ kiện cao cấp và thời trang hàng hiệu được
                  chăm sóc, bảo quản theo tiêu chuẩn chuyên nghiệp.
                </p>
              </div>

              <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-[#ebe8e1]">
                <img
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  src="./src/assets/images/register.jpg"
                  alt="Vintage camera and restored equipment"
                />

                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-6">
                  <span className="text-[11px] uppercase tracking-wider text-white/75">
                    BỘ SỰ TẬP MỚI · SERIES 18
                  </span>

                  <span className="mt-1 text-base font-medium text-white">
                    Urbansheek & Bộ Sưu Tập Thời Trang Xu Hướng
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3 rounded-lg bg-[#ebe8e1]/60 p-4">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider">
                <span className="font-semibold text-[#141310]">
                  CAM KẾT CỘNG ĐỒNG
                </span>

                <span className="font-semibold text-[#576151]">
                  REV 2026.11
                </span>
              </div>

              <div className="space-y-2 text-xs leading-relaxed text-[#4a463f]">
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#576151]" />

                  <span>
                    Cam kết không tăng giá đầu cơ — chi phí thuê minh bạch,
                    chuẩn hóa và được xác thực bởi cộng đồng.
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#576151]" />

                  <span>
                    Kích hoạt tự động quyền thành viên Tầng 1 đi kèm chính
                    sách bảo vệ trang phục toàn diện.
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Right column */}
          <section className="flex flex-col justify-center lg:col-span-7">
            <div className="space-y-6 rounded-xl bg-white p-8 shadow-md md:p-12">

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded bg-[#d8e3ce]/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#5b6655]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#576151]" />
                  Giới Thiệu Thành Viên · Quyền Truy Cập Tầng 1
                </div>

                <h1 className="font-serif text-[40px] font-normal tracking-tight text-[#141310]">
                  Đăng Kí Tài Khoản
                </h1>

                <p className="text-sm leading-relaxed text-[#4a463f]">
                  Tham gia ReUse Hub để thuê trang phục cao cấp và trải nghiệm
                  tủ đồ thời trang tuần hoàn bền vững.
                </p>
              </div>

              {apiError && (
                <div className="flex items-start gap-3 rounded-lg bg-[#ffdad6] p-4 text-[#93000a]">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                  <div>
                    <p className="font-semibold">
                      Đăng Ký Thất Bại
                    </p>

                    <p className="mt-1 text-xs">
                      {apiError}
                    </p>
                  </div>
                </div>
              )}

              {registerSuccess && (
                <div className="flex items-start gap-3 rounded-lg bg-[#d8e3ce] p-4 text-[#3f4a3a]">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />

                  <div>
                    <p className="font-semibold">
                      Tài Khoản Đã Được Tạo
                    </p>

                    <p className="mt-1 text-xs">
                      Đăng ký thành công. Đang chuyển đến trang đăng nhập...
                    </p>
                  </div>
                </div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
              >

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="fullName"
                    className="block text-[13px] font-semibold text-[#1c1c18]"
                  >
                    Họ và Tên <span className="text-[#ba1a1a]">*</span>
                  </label>

                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4a463f]" />

                    <input
                      id="fullName"
                      type="text"
                      placeholder="Nguyễn Văn A"
                      autoComplete="name"
                      {...register("fullName")}
                      className={`w-full rounded bg-[#f7f3ec] py-3 pl-10 pr-4 text-sm outline-none transition-all focus:bg-white focus:ring-1 ${
                        errors.fullName
                          ? "ring-1 ring-[#ba1a1a]"
                          : "focus:ring-[#141310]"
                      }`}
                    />
                  </div>

                  {errors.fullName && (
                    <p className="text-xs text-[#ba1a1a]">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="block text-[13px] font-semibold text-[#1c1c18]"
                  >
                    Địa Chỉ Email <span className="text-[#ba1a1a]">*</span>
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4a463f]" />

                    <input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      {...register("email", {
                        onChange: () => {
                          if (errors.email?.type === "server") {
                            clearErrors("email");
                          }
                        },
                      })}
                      className={`w-full rounded bg-[#f7f3ec] py-3 pl-10 pr-4 text-sm outline-none transition-all focus:bg-white focus:ring-1 ${
                        errors.email
                          ? "ring-1 ring-[#ba1a1a]"
                          : "focus:ring-[#141310]"
                      }`}
                    />
                  </div>

                  {errors.email && (
                    <p className="text-xs text-[#ba1a1a]">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="phoneNumber"
                      className="block text-[13px] font-semibold text-[#1c1c18]"
                    >
                      Số Điện Thoại
                    </label>

                    <span className="text-[11px] text-[#7b766f]">
                      (Không bắt buộc)
                    </span>
                  </div>

                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4a463f]" />

                    <input
                      id="phoneNumber"
                      type="tel"
                      placeholder="0901234567"
                      autoComplete="tel"
                      {...register("phoneNumber")}
                      className="w-full rounded bg-[#f7f3ec] py-3 pl-10 pr-4 text-sm outline-none transition-all focus:bg-white focus:ring-1 focus:ring-[#141310]"
                    />
                  </div>

                  <p className="text-xs text-[#7b766f]">
                    Dùng để xác nhận giao hàng và thông báo vận chuyển.
                  </p>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  {errors.role && (
                    <p className="text-xs text-[#ba1a1a]">
                      {errors.role.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="block text-[13px] font-semibold text-[#1c1c18]"
                  >
                    Mật Khẩu <span className="text-[#ba1a1a]">*</span>
                  </label>

                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4a463f]" />

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Tạo mật khẩu bảo mật"
                      autoComplete="new-password"
                      {...register("password")}
                      className={`w-full rounded bg-[#f7f3ec] py-3 pl-10 pr-12 text-sm outline-none transition-all focus:bg-white focus:ring-1 ${
                        errors.password
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
                      onClick={() =>
                        setShowPassword((value) => !value)
                      }
                      className="absolute right-0 top-0 flex h-full items-center px-3 text-[#4a463f] hover:text-[#141310]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#7b766f]">
                        Độ mạnh mật khẩu
                      </span>

                      <span
                        className={`font-semibold ${
                          passwordStrength.level === 1
                            ? "text-[#ba1a1a]"
                            : passwordStrength.level > 1
                              ? "text-[#576151]"
                              : "text-[#7b766f]"
                        }`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>

                    <div className="flex h-1.5 gap-1 overflow-hidden rounded-full bg-[#ebe8e1]">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-full flex-1 transition-colors ${
                            passwordStrength.level >= level
                              ? passwordStrength.level === 1
                                ? "bg-[#ba1a1a]"
                                : "bg-[#576151]"
                              : "bg-[#ccc5bc]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {errors.password && (
                    <p className="text-xs text-[#ba1a1a]">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-[13px] font-semibold text-[#1c1c18]"
                  >
                    Xác Nhận Mật Khẩu{" "}
                    <span className="text-[#ba1a1a]">*</span>
                  </label>

                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4a463f]" />

                    <input
                      id="confirmPassword"
                      type={
                        showConfirmPassword ? "text" : "password"
                      }
                      placeholder="Nhập lại mật khẩu"
                      autoComplete="new-password"
                      {...register("confirmPassword")}
                      className={`w-full rounded bg-[#f7f3ec] py-3 pl-10 pr-12 text-sm outline-none transition-all focus:bg-white focus:ring-1 ${
                        errors.confirmPassword
                          ? "ring-1 ring-[#ba1a1a]"
                          : "focus:ring-[#141310]"
                      }`}
                    />

                    <button
                      type="button"
                      aria-label={
                        showConfirmPassword
                          ? "Ẩn mật khẩu xác nhận"
                          : "Hiển thị mật khẩu xác nhận"
                      }
                      onClick={() =>
                        setShowConfirmPassword((value) => !value)
                      }
                      className="absolute right-0 top-0 flex h-full items-center px-3 text-[#4a463f] hover:text-[#141310]"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {errors.confirmPassword && (
                    <p className="text-xs text-[#ba1a1a]">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Agreement */}
                <div className="pt-2">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      {...register("agreement")}
                      className="mt-1 h-4 w-4 accent-[#576151]"
                    />

                    <span className="text-xs leading-relaxed text-[#4a463f]">
                      Tôi đồng ý với{" "}
                      <a
                        href="#"
                        className="font-medium text-[#141310] underline"
                      >
                        Điều khoản dịch vụ
                      </a>{" "}
                      và{" "}
                      <a
                        href="#"
                        className="font-medium text-[#141310] underline"
                      >
                        Chính sách bảo mật
                      </a>
                      .
                    </span>
                  </label>

                  {errors.agreement && (
                    <p className="mt-1.5 text-xs text-[#ba1a1a]">
                      {errors.agreement.message}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || registerSuccess}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#141310] px-6 py-3.5 text-[13px] font-medium uppercase tracking-wider text-white shadow-sm transition-all hover:bg-[#4a463f] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <span>Đăng Ký →</span>
                    )}
                  </button>
                </div>

                {/* Login */}
                <div className="pt-2 text-center">
                  <p className="text-sm text-[#4a463f]">
                    Đã có tài khoản?

                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="ml-1 font-semibold text-[#141310] underline underline-offset-4 hover:text-[#576151]"
                    >
                      Đăng nhập
                    </button>
                  </p>
                </div>
              </form>

              {/* Trust */}
              <div className="rounded-lg bg-[#f7f3ec]/50 p-3 text-center">
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-wider text-[#7b766f]">
                  <span className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Dữ Liệu Được Mã Hóa
                  </span>

                  <span>•</span>

                  <span>
                    Quyền Riêng Tư Thành Viên Được Bảo Vệ
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Register;