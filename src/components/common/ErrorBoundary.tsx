import { Component, type ErrorInfo, type ReactNode } from "react";
import { resetAppStorage } from "../../utils/safeStorage";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught application error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearStorageAndReload = () => {
    resetAppStorage(true);
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isQuotaError =
        this.state.error?.name === "QuotaExceededError" ||
        this.state.error?.message?.includes("exceeded the quota");

      return (
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 text-[#1A1816] font-sans">
          <div className="max-w-xl w-full bg-white rounded-2xl border border-[#E8E2D5] shadow-xl p-8 sm:p-10 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 text-2xl shadow-sm">
              ⚠️
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-serif font-bold text-[#141310] tracking-tight">
                {isQuotaError ? "Bộ nhớ trình duyệt tạm thời quá tải" : "Đã xảy ra sự cố không mong muốn"}
              </h1>
              <p className="text-sm text-[#6B655D] leading-relaxed">
                {isQuotaError
                  ? "Dung lượng bộ nhớ trình duyệt (localStorage) đã đầy do lưu trữ nhiều hình ảnh hoặc dữ liệu mẫu. Bạn có thể nhấn 'Xóa bộ nhớ đệm & Khôi phục' để tiếp tục sử dụng ngay."
                  : "Ứng dụng gặp sự cố giao diện không lường trước. Bạn có thể thử tải lại trang hoặc khôi phục bộ nhớ đệm để hệ thống hoạt động ổn định trở lại."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 px-5 py-3 rounded-xl bg-[#141310] hover:bg-[#2B2925] text-white text-sm font-semibold transition-all shadow-sm active:scale-[0.99] text-center"
              >
                Tải lại trang
              </button>
              <button
                onClick={this.handleClearStorageAndReload}
                className="flex-1 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-all shadow-sm active:scale-[0.99] text-center"
              >
                Xóa bộ nhớ đệm & Khôi phục
              </button>
            </div>

            {this.state.error && (
              <details className="mt-4 pt-4 border-t border-[#F0EBE1] text-xs text-[#8A8275]">
                <summary className="cursor-pointer font-medium hover:text-[#141310] transition-colors select-none py-1">
                  Xem chi tiết lỗi kỹ thuật
                </summary>
                <div className="mt-2 p-3 bg-[#FBF9F5] border border-[#E8E2D5] rounded-lg overflow-x-auto font-mono text-[11px] text-red-700 space-y-1">
                  <p className="font-bold">{this.state.error.toString()}</p>
                  {this.state.error.stack && (
                    <pre className="whitespace-pre-wrap text-[#6B655D] text-[10px] mt-1">
                      {this.state.error.stack.split("\n").slice(0, 5).join("\n")}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
