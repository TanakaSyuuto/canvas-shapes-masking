import { useCallback, useEffect, useRef, useState } from 'react';
const useApp = () => {
  // 図形の情報
  const drawRectProps = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    style: '#000',
    lineWidth: 1
  };

  // マスキング用キャンバス
  const maskingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // 結合用キャンバス
  const resultCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const result_canvas = document.getElementById('result-canvas') as HTMLCanvasElement;
    const masking_canvas = document.getElementById('masking-canvas') as HTMLCanvasElement;

    if (!result_canvas) return;
    // 3. Canvas要素のサイズを設定する。
    result_canvas.setAttribute('width', '500');
    result_canvas.setAttribute('height', '500');

    masking_canvas.setAttribute('width', '500');
    masking_canvas.setAttribute('height', '500');

    // Canvasに合成したい画像を設定する
    const imagePath = `${process.env.PUBLIC_URL}/images/test-paper-japanese.png`;

    const image = new Image();
    image.src = imagePath;

    // 画像が読み込まれた後に実行される処理
    image.onload = () => {
      const context = result_canvas.getContext('2d');
      if (!context) return;
      context.drawImage(image, 0, 0, result_canvas.width, result_canvas.height);
      setImg(image);
    };
  }, []);

  /**
   * マスキング用キャンバスのコンテキスト取得処理
   */
  const getMaskingContext = useCallback(() => {
    const canvas = maskingCanvasRef.current;
    return canvas ? canvas.getContext('2d') : null;
  }, []);

  /**
   * 結合用キャンバスのコンテキスト取得処理
   */
  const getResultContext = useCallback(() => {
    const canvas = resultCanvasRef.current;
    return canvas ? canvas.getContext('2d') : null;
  }, []);

  /**
   * マスク描画開始処理
   *
   * @param {React.MouseEvent<HTMLCanvasElement>} event イベント
   */
  const onDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (event.button !== 0) {
        return;
      }

      const canvas = maskingCanvasRef.current;
      const ctx = canvas?.getContext('2d');

      if (!canvas || !ctx) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x = ~~(event.clientX - rect.left);
      const y = ~~(event.clientY - rect.top);

      drawRectProps.x = x;
      drawRectProps.y = y;
    },
    [drawRectProps]
  );

  /**
   * マスク描画中の処理
   *
   * @param {React.MouseEvent<HTMLCanvasElement>} event イベント
   */
  const onMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (event.buttons !== 1) {
        return;
      }

      const canvas = maskingCanvasRef.current;
      const ctx = canvas?.getContext('2d');

      if (!canvas || !ctx) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x = ~~(event.clientX - rect.left);
      const y = ~~(event.clientY - rect.top);

      drawRectProps.width = x - drawRectProps.x;
      drawRectProps.height = y - drawRectProps.y;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillRect(drawRectProps.x, drawRectProps.y, drawRectProps.width, drawRectProps.height);
      ctx.strokeRect(drawRectProps.x, drawRectProps.y, drawRectProps.width, drawRectProps.height);
    },
    [drawRectProps]
  );

  /**
   * Canvasを画像として取得
   *
   * @param {string} id 対象canvasのid
   * @return {Promise<CanvasImageSource>}
   */
  const getImagefromCanvas = useCallback((id: string): Promise<CanvasImageSource> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const canvas = <HTMLCanvasElement>document.querySelector(id);
      const ctx = canvas.getContext('2d');
      image.onload = () => resolve(image);
      image.onerror = (e) => reject(e);
      image.src = ctx?.canvas.toDataURL() ?? '';
    });
  }, []);

  /**
   * Canvasをマージ
   *
   * @param {string} base 合成結果を描画するcanvasのid
   * @param {Array<string>} asset 合成する素材canvasのid
   */
  const concatCanvas = useCallback(
    async (base: string, asset: Array<string>) => {
      const canvas = <HTMLCanvasElement>document.querySelector(base);
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      for (let i = 0; i < asset.length; i++) {
        const img = await getImagefromCanvas(asset[i]);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    },
    [getImagefromCanvas]
  );

  /**
   * ImageDataからImageオブジェクトを生成する
   *
   * @param {ImageData} img_data canvasから取得したImageData
   * @return {HTMLImageElement}
   */
  const imagedataToImage = useCallback((img_data: ImageData) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = img_data.width;
    canvas.height = img_data.height;
    ctx.putImageData(img_data, 0, 0);

    const image = new Image();
    image.src = canvas.toDataURL();
    return image;
  }, []);

  /**
   * 画像をダウンロード
   */
  const handleClickDownload = useCallback(() => {
    // canvasの画像をbase64に加工
    const canvas = resultCanvasRef.current;
    const dataURL = canvas?.toDataURL() ?? '';

    let a = document.createElement('a');
    a.href = dataURL ?? '';
    a.download = 'image.jpg';
    a.click();
  }, []);

  /**
   * マスク描画終了処理
   */
  const drawEnd = useCallback(() => {
    const ctx = getMaskingContext();
    if (!ctx || !img) {
      return;
    }
    // キャンバスを結合
    concatCanvas('#result-canvas', ['#masking-canvas']);

    // note 結合用canvasにマスキングが反映されるまで、遅延させる
    window.setTimeout(function () {
      // 図形挿入モードのキャンバス
      const result_ctx = getResultContext();

      if (!result_ctx) {
        return;
      }

      const new_img = imagedataToImage(result_ctx.getImageData(0, 0, img.width, img.height));

      if (!new_img) {
        return;
      }
    }, 100);
  }, [img, window, getMaskingContext, concatCanvas, getResultContext, imagedataToImage]);

  return {
    onDown,
    onMove,
    drawEnd,
    resultCanvasRef,
    maskingCanvasRef,
    handleClickDownload
  };
};

export default useApp;
