// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { uploadSecureDocument, encodeDocumentRef, type DocType } from '@/lib/cloudinary';

const VALID_DOC_TYPES: DocType[] = ['id_document', 'bank_statement'];

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const docTypeRaw = formData.get('docType') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const docType: DocType = VALID_DOC_TYPES.includes(docTypeRaw as DocType)
      ? (docTypeRaw as DocType)
      : 'id_document';

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, JPG, and PNG are allowed' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadSecureDocument(buffer, userId, docType, file.name);

    // We store an encoded ref ("resourceType|format|publicId") as the
    // idDocumentUrl/bankStatementUrl value. It is NOT a public URL — it's
    // metadata later decoded to mint a short-lived signed URL.
    const ref = encodeDocumentRef(result.resourceType, result.format, result.publicId);

    return NextResponse.json(
      {
        url: ref,
        docType,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}