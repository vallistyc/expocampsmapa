'use client';

import { forwardRef } from 'react';
import Image from 'next/image'

const Scene1 = forwardRef<HTMLDivElement>((props, ref) => {
  return (
    <div ref={ref} className='flex flex-col w-full px-4 py-50 justify-center items-center'>
        <h1 className='text-center font-poppins pb-5'>
            <span className='text-yellow-500 font-bold font-fraunces text-4xl'>Inget waktu kamu Kelas 3 SMA?</span><br />
        </h1>
        <p className='text-md font-poppins text-center px-4'>
          Nyari info kampus sendirian, tanya sana-sini, dan berharap ada jawaban?
        </p>
        <Image 
        src="/s1.png"
        alt="cara menentukan jurusan kuliah"
        width={800}
        height={400}
        quality={95}
        priority
        className='w-full max-w-3xl md:w-2/3 h-auto'
        />
    </div>
  )
});

Scene1.displayName = 'Scene1';

export default Scene1