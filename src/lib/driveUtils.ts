/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

/**
 * Fetches files from Google Drive using the provided access token.
 */
export async function listDriveFiles(accessToken: string): Promise<DriveFile[]> {
  const response = await fetch(
    'https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id, name, mimeType)',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Drive API Error:', errorData);
    throw new Error(`Failed to fetch Drive files: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Fetches the content of a specific file.
 * Handles Google Docs (by exporting to text) and text files.
 */
export async function getFileContent(accessToken: string, file: DriveFile): Promise<string> {
  let url = `https://www.googleapis.com/drive/v3/files/${file.id}`;
  
  if (file.mimeType === 'application/vnd.google-apps.document') {
    url += '/export?mimeType=text/plain';
  } else {
    url += '?alt=media';
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch file content: ${file.name}`);
  }

  return await response.text();
}
