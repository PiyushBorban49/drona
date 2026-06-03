import mux_python
from mux_python.rest import ApiException
from app.config import get_settings
import os

def get_mux_client():
    settings = get_settings()
    configuration = mux_python.Configuration()
    configuration.username = settings.MUX_TOKEN_ID
    configuration.password = settings.MUX_SECRET_KEY
    return mux_python.AssetsApi(mux_python.ApiClient(configuration))

def upload_to_mux(file_path: str):
    """
    Uploads a local video file to Mux and returns the playback ID.
    Note: For production, we should ideally use a direct upload URL or a cloud bucket.
    For this implementation, we will use Mux's POST /assets with a public URL 
    (or assuming the server is publicly accessible).
    
    Correction: Mux assets usually pull from a URL. If we want to 'push' a file, 
    we need to use a Mux Direct Upload.
    """
    settings = get_settings()
    assets_api = get_mux_client()
    
    # Since we are on a local/private server, Mux cannot 'pull' the file from our local path.
    # We should use Direct Uploads.
    direct_uploads_api = mux_python.DirectUploadsApi(mux_python.ApiClient(assets_api.api_client.configuration))
    
    try:
        # 1. Create a Direct Upload
        create_asset_request = mux_python.CreateAssetRequest(playback_policy=[mux_python.PlaybackPolicy.PUBLIC])
        create_upload_request = mux_python.CreateUploadRequest(new_asset_settings=create_asset_request, cors_origin="*")
        upload = direct_uploads_api.create_direct_upload(create_upload_request)
        
        # 2. Upload the file to the provided upload URL
        # We'll use requests to PUT the file
        import requests
        with open(file_path, "rb") as f:
            response = requests.put(upload.data.url, data=f)
            response.raise_for_status()
            
        print(f"--- Mux Upload Started: {upload.data.id} ---")
        return {
            "success": True,
            "upload_id": upload.data.id,
            "asset_id": upload.data.asset_id, # This might be null until upload completes
            "status": "uploading"
        }
    except Exception as e:
        print(f"--- Mux Upload Failed: {e} ---")
        return {"success": False, "error": str(e)}

def get_asset_playback_id(asset_id: str):
    """Retrieves the playback ID for a given asset."""
    assets_api = get_mux_client()
    try:
        asset = assets_api.get_asset(asset_id)
        if asset.data.playback_ids:
            return asset.data.playback_ids[0].id
        return None
    except Exception as e:
        print(f"--- Mux Get Asset Failed: {e} ---")
        return None
