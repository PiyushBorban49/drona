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
    settings = get_settings()
    assets_api = get_mux_client()
    
    direct_uploads_api = mux_python.DirectUploadsApi(mux_python.ApiClient(assets_api.api_client.configuration))
    
    try:
        create_asset_request = mux_python.CreateAssetRequest(playback_policy=[mux_python.PlaybackPolicy.PUBLIC])
        create_upload_request = mux_python.CreateUploadRequest(new_asset_settings=create_asset_request, cors_origin="*")
        upload = direct_uploads_api.create_direct_upload(create_upload_request)
        
        import requests
        with open(file_path, "rb") as f:
            response = requests.put(upload.data.url, data=f)
            response.raise_for_status()
            
        print(f"--- Mux Upload Started: {upload.data.id} ---")
        return {
            "success": True,
            "upload_id": upload.data.id,
            "asset_id": upload.data.asset_id,
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
