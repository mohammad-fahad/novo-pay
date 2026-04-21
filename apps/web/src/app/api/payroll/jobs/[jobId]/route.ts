import { proxyJson } from "../../../_lib/backend";

export async function GET(
  _req: Request,
  context: { params: Promise<{ jobId: string }> },
): Promise<Response> {
  const { jobId } = await context.params;
  return proxyJson(`/api/payroll/jobs/${encodeURIComponent(jobId)}`, {
    method: "GET",
  });
}
