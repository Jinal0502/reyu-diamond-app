import puppeteer from "puppeteer";
import cloudinary from "../config/cloudinary";
import { Deal } from "../models/Deal.model";
import { dealHtmlTemplate } from "../utils/templates/deal.template";
import logger from "../utils/logger";
import { CustomError, ErrorCode, HTTP_STATUS } from "../utils";

export const generateAndUploadDealPdf = async (dealId: string) => {
  const deal = await Deal.findById(dealId)
    .populate("inventoryId")
    .populate("buyerId", "name email")
    .populate("sellerId", "name email")
    .populate("bidId")
    .populate("auctionId"); // ✅ ADDED

  if (!deal) {
    throw new CustomError("Deal not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);
  }

  // Generate HTML
  const html = dealHtmlTemplate(deal);

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  // Generate PDF
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "20mm",
      bottom: "25mm",
      left: "15mm",
      right: "15mm",
    },
  });

  await browser.close();

  const fileName = `Invoice_${deal._id}_${new Date()
    .toISOString()
    .slice(0, 10)}`;

  // Upload to Cloudinary (RAW)
  const uploadResult = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "deals/pdfs",
          resource_type: "raw", // ✅ FIXED (pdf must be raw)
          public_id: `deal_${deal._id}`,
          format: "pdf",
          flags: "attachment", // ✅ FIXED
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      )
      .end(pdfBuffer);
  });

  // Save PDF URL
  deal.pdfPath = uploadResult.secure_url;
  await deal.save();

  logger.info("Deal PDF generated and uploaded", { dealId, pdfUrl: uploadResult.secure_url });

  return {
    pdfUrl: uploadResult.secure_url,
    fileName: `${fileName}.pdf`,
  };
};
