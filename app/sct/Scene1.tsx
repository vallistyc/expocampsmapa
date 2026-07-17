import Image from 'next/image'

const Scene1 = () => {
  return (
    <div className='flex flex-col w-full px-4 py-30 justify-center items-center'>
        <h1 className='text-center font-poppins pb-5'>
            <span className='text-yellow-500 font-bold font-fraunces text-4xl'>Inget waktu kamu Kelas 3 SMA?</span><br />
        </h1>
        <p className='text-md font-poppins text-center px-4'>
          Nyari info kampus sendirian, tanya sana-sini, dan berharap ada jawaban?
        </p>
        <Image 
        src="/s1.png"
        alt="cara menentukan jurusan kuliah"
        width={150}
        height={50}
        className='w-full h-auto'
        />
    </div>
  )
}

export default Scene1