export async function getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
  // Stub: wraps navigator.mediaDevices.getUserMedia
  return navigator.mediaDevices.getUserMedia(constraints);
}

export async function checkPermission(type: 'camera' | 'microphone'): Promise<boolean> {
  try {
    const permName = type === 'camera' ? 'camera' as PermissionName : 'microphone' as PermissionName;
    const result = await navigator.permissions.query({ name: permName });
    return result.state === 'granted';
  } catch {
    return false;
  }
}

export async function getDevices(kind?: MediaDeviceKind): Promise<MediaDeviceInfo[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  if (kind) {
    return devices.filter((d) => d.kind === kind);
  }
  return devices;
}

export function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}
