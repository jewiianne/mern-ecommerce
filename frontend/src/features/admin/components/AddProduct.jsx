import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate} from 'react-router-dom'
import { addProductAsync, resetProductAddStatus, selectProductAddStatus,updateProductByIdAsync } from '../../products/ProductSlice'
import { Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography, useMediaQuery, useTheme } from '@mui/material'
import { useForm } from "react-hook-form"
import { selectBrands } from '../../brands/BrandSlice'
import { selectCategories } from '../../categories/CategoriesSlice'
import { toast } from 'react-toastify'

export const AddProduct = () => {

    const {register,handleSubmit,reset,formState: { errors }} = useForm()

    const dispatch=useDispatch()
    const brands=useSelector(selectBrands)
    const categories=useSelector(selectCategories)
    const productAddStatus=useSelector(selectProductAddStatus)
    const navigate=useNavigate()
    const theme=useTheme()
    const is1100=useMediaQuery(theme.breakpoints.down(1100))
    const is480=useMediaQuery(theme.breakpoints.down(480))

    useEffect(()=>{
        if(productAddStatus==='fullfilled'){
            reset()
            toast.success("New product added")
            navigate("/admin/dashboard")
        }
        else if(productAddStatus==='rejected'){
            toast.error("Error adding product, please try again later")
        }
    },[productAddStatus])

    useEffect(()=>{
        return ()=>{
            dispatch(resetProductAddStatus())
        }
    },[])

    const handleAddProduct=(data)=>{
        const newProduct={...data,images:[data.image0,data.image1,data.image2,data.image3]}
        delete newProduct.image0
        delete newProduct.image1
        delete newProduct.image2
        delete newProduct.image3

        dispatch(addProductAsync(newProduct))
    }

  return (
    <Stack p={'0 16px'} justifyContent={'center'} alignItems={'center'} flexDirection={'row'} >

        <Stack width={is1100?"100%":"60rem"} rowGap={4} mt={is480?4:6} mb={6}
            component={'form'} noValidate onSubmit={handleSubmit(handleAddProduct)}> 
            
            <Stack rowGap={3}>

                {/* TITLE */}
                <TextField
                    label="Title"
                    inputProps={{ id: "title", "data-testid": "title" }}
                    {...register("title",{required:'Title is required'})}
                />

                {/* BRAND + CATEGORY */}
                <Stack flexDirection={'row'} >

                    <FormControl fullWidth>
                        <InputLabel id="brand-selection">Brand</InputLabel>
                        <Select
                            labelId="brand-selection"
                            label="Brand"
                            inputProps={{ id: "brand", "data-testid": "brand" }}
                            {...register("brand",{required:"Brand is required"})}
                        >
                            {brands.map((brand)=>(
                                <MenuItem key={brand._id} value={brand._id}>
                                    {brand.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel id="category-selection">Category</InputLabel>
                        <Select
                            labelId="category-selection"
                            label="Category"
                            inputProps={{ id: "category", "data-testid": "category" }}
                            {...register("category",{required:"category is required"})}
                        >
                            {categories.map((category)=>(
                                <MenuItem key={category._id} value={category._id}>
                                    {category.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                </Stack>

                {/* DESCRIPTION */}
                <TextField
                    label="Description"
                    multiline rows={4}
                    inputProps={{ id: "description", "data-testid": "description" }}
                    {...register("description",{required:"Description is required"})}
                />

                {/* PRICE + DISCOUNT */}
                <Stack flexDirection={'row'}>
                    <TextField
                        label="Price"
                        type='number'
                        inputProps={{ id: "price", "data-testid": "price" }}
                        {...register("price",{required:"Price is required"})}
                    />
                    <TextField
                        label="Discount"
                        type='number'
                        inputProps={{ id: "discountPercentage", "data-testid": "discountPercentage" }}
                        {...register("discountPercentage",{required:"discount percentage is required"})}
                    />
                </Stack>

                {/* STOCK */}
                <TextField
                    label="Stock Quantity"
                    type='number'
                    inputProps={{ id: "stockQuantity", "data-testid": "stockQuantity" }}
                    {...register("stockQuantity",{required:"Stock Quantity is required"})}
                />

                {/* THUMBNAIL */}
                <TextField
                    label="Thumbnail"
                    inputProps={{ id: "thumbnail", "data-testid": "thumbnail" }}
                    {...register("thumbnail",{required:"Thumbnail is required"})}
                />

                {/* IMAGES */}
                <Stack rowGap={2}>
                    <TextField inputProps={{ id: "image0", "data-testid": "image0" }} {...register("image0")} />
                    <TextField inputProps={{ id: "image1", "data-testid": "image1" }} {...register("image1")} />
                    <TextField inputProps={{ id: "image2", "data-testid": "image2" }} {...register("image2")} />
                    <TextField inputProps={{ id: "image3", "data-testid": "image3" }} {...register("image3")} />
                </Stack>

            </Stack>

            {/* ACTIONS */}
            <Stack flexDirection={'row'} alignSelf={'flex-end'}>
                <Button
                    type='submit'
                    variant='contained'
                    data-testid="submit-product"
                >
                    Add Product
                </Button>

                <Button
                    variant='outlined'
                    color='error'
                    component={Link}
                    to={'/admin/dashboard'}
                >
                    Cancel
                </Button>
            </Stack>

        </Stack>

    </Stack>
  )
}
